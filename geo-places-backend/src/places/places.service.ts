import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { request as httpRequest } from 'http';
import { request as httpsRequest } from 'https';
import { Repository } from 'typeorm';
import { AiRecommendationDto, AiPlaceContextDto } from './dto/ai-recommendation.dto';
import { CreatePlaceDto } from './dto/create-place.dto';
import { FindPlacesQueryDto } from './dto/find-places-query.dto';
import { UpdatePlaceDto } from './dto/update-place.dto';
import { PlaceEntity } from './entities/place.entity';

export interface AiRecommendationStep {
  title: string;
  reason: string;
}

export interface AiRecommendationResponse {
  provider: 'openai' | 'gemini' | 'local';
  summary: string;
  steps: AiRecommendationStep[];
  usedPlaces: number[];
  fallbackReason?: string;
}

interface ChatCompletionResponse {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
}

interface GeminiGenerateContentResponse {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
}

type AiProvider = 'openai' | 'gemini';

@Injectable()
export class PlacesService {
  constructor(
    @InjectRepository(PlaceEntity)
    private readonly placeRepository: Repository<PlaceEntity>,
    private readonly configService: ConfigService,
  ) {}

  async findAll(query: FindPlacesQueryDto) {
    const qb = this.placeRepository.createQueryBuilder('place');

    if (query.type) {
      qb.andWhere('place.type = :type', { type: query.type });
    }

    if (query.search) {
      qb.andWhere(
        "(LOWER(place.title) LIKE LOWER(:search) OR LOWER(COALESCE(place.description, '')) LIKE LOWER(:search))",
        {
          search: `%${query.search}%`,
        },
      );
    }

    if (query.minRating !== undefined) {
      qb.andWhere('place.rating >= :minRating', {
        minRating: query.minRating,
      });
    }

    if (query.upcomingOnly) {
      qb.andWhere('place.eventStartAt IS NOT NULL');
      qb.andWhere('place.eventStartAt >= NOW()');
    }

    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    qb.orderBy(`place.${sortBy}`, sortOrder);

    return qb.getMany();
  }

  async findOne(id: number) {
    const place = await this.placeRepository.findOne({
      where: { id },
    });

    if (!place) {
      throw new NotFoundException('Place not found');
    }

    return place;
  }

  async create(dto: CreatePlaceDto) {
    const place = this.placeRepository.create(dto);
    return this.placeRepository.save(place);
  }

  async update(id: number, dto: UpdatePlaceDto) {
    const place = await this.findOne(id);

    Object.assign(place, dto);

    return this.placeRepository.save(place);
  }

  async remove(id: number) {
    const place = await this.findOne(id);
    await this.placeRepository.remove(place);

    return {
      message: 'Place deleted successfully',
    };
  }

  async generateAiRecommendation(
    dto: AiRecommendationDto,
  ): Promise<AiRecommendationResponse> {
    const places = dto.places
      .slice(0, 40)
      .sort((first, second) => second.rating - first.rating);

    if (places.length === 0) {
      return {
        provider: 'local',
        summary: 'Add or reveal places on the map before asking for a route.',
        steps: [],
        usedPlaces: [],
      };
    }

    const provider = this.resolveAiProvider();
    const apiKey =
      provider === 'gemini'
        ? this.configService.get<string>('GEMINI_API_KEY')
        : this.configService.get<string>('OPENAI_API_KEY');

    if (!apiKey) {
      return this.buildLocalRecommendation(
        dto.prompt,
        places,
        `${provider === 'gemini' ? 'GEMINI_API_KEY' : 'OPENAI_API_KEY'} is not configured.`,
      );
    }

    try {
      return provider === 'gemini'
        ? await this.requestGeminiRecommendation(dto.prompt, places, apiKey)
        : await this.requestOpenAiRecommendation(dto.prompt, places, apiKey);
    } catch (error) {
      return this.buildLocalRecommendation(
        dto.prompt,
        places,
        error instanceof Error ? error.message : 'AI provider request failed.',
      );
    }
  }

  private resolveAiProvider(): AiProvider {
    const configuredProvider = this.configService
      .get<string>('AI_PROVIDER', '')
      .trim()
      .toLowerCase();

    if (configuredProvider === 'gemini' || configuredProvider === 'openai') {
      return configuredProvider;
    }

    return this.configService.get<string>('GEMINI_API_KEY') ? 'gemini' : 'openai';
  }

  private async requestOpenAiRecommendation(
    prompt: string,
    places: AiPlaceContextDto[],
    apiKey: string,
  ): Promise<AiRecommendationResponse> {
    const model = this.configService.get<string>('OPENAI_MODEL', 'gpt-4o-mini');
    const apiUrl = this.configService.get<string>(
      'OPENAI_API_URL',
      'https://api.openai.com/v1/chat/completions',
    );

    const payload = await this.postJson<ChatCompletionResponse>(
      apiUrl,
      {
        Authorization: `Bearer ${apiKey}`,
      },
      {
        model,
        temperature: 0.4,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: this.getAiSystemPrompt() },
          {
            role: 'user',
            content: JSON.stringify(this.buildAiInput(prompt, places)),
          },
        ],
      },
    );
    const content = payload.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error('AI provider returned an empty response');
    }

    return this.normalizeAiResponse(content, 'openai');
  }

  private async requestGeminiRecommendation(
    prompt: string,
    places: AiPlaceContextDto[],
    apiKey: string,
  ): Promise<AiRecommendationResponse> {
    const model = this.configService.get<string>(
      'GEMINI_MODEL',
      'gemini-2.5-flash-lite',
    );
    const apiBaseUrl = this.configService.get<string>(
      'GEMINI_API_URL',
      'https://generativelanguage.googleapis.com/v1beta',
    );
    const apiUrl = `${apiBaseUrl.replace(/\/$/, '')}/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

    const payload = await this.postJson<GeminiGenerateContentResponse>(
      apiUrl,
      {},
      {
        systemInstruction: {
          parts: [{ text: this.getAiSystemPrompt() }],
        },
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: JSON.stringify(this.buildAiInput(prompt, places)),
              },
            ],
          },
        ],
        generationConfig: {
          temperature: 0.4,
          responseMimeType: 'application/json',
        },
      },
    );
    const content = payload.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!content) {
      throw new Error('AI provider returned an empty response');
    }

    return this.normalizeAiResponse(content, 'gemini');
  }

  private postJson<T>(
    url: string,
    headers: Record<string, string>,
    body: unknown,
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const endpoint = new URL(url);
      const requestBody = JSON.stringify(body);
      const request = endpoint.protocol === 'http:' ? httpRequest : httpsRequest;
      const outgoingRequest = request(
        endpoint,
        {
          method: 'POST',
          headers: {
            ...headers,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(requestBody),
          },
        },
        (response) => {
          let responseBody = '';

          response.setEncoding('utf8');
          response.on('data', (chunk) => {
            responseBody += chunk;
          });
          response.on('end', () => {
            if (!response.statusCode || response.statusCode >= 400) {
              let errorCode = '';

              try {
                const parsedError = JSON.parse(responseBody) as {
                  error?: { code?: string; type?: string };
                };
                errorCode =
                  parsedError.error?.code ?? parsedError.error?.type ?? '';
              } catch {
                errorCode = '';
              }

              reject(
                new Error(
                  `AI provider returned ${response.statusCode}${
                    errorCode ? ` (${errorCode})` : ''
                  }.`,
                ),
              );
              return;
            }

            try {
              resolve(JSON.parse(responseBody) as T);
            } catch (error) {
              reject(error);
            }
          });
        },
      );

      outgoingRequest.on('error', reject);
      outgoingRequest.write(requestBody);
      outgoingRequest.end();
    });
  }

  private getAiSystemPrompt() {
    return 'You are a concise city route planner. Return only valid JSON with keys summary, steps, usedPlaces. steps is an array of objects with title and reason. usedPlaces is an array of numeric place ids from the provided list.';
  }

  private buildAiInput(prompt: string, places: AiPlaceContextDto[]) {
    return {
      goal: prompt,
      places: places.map((place) => ({
        id: place.id,
        title: place.title,
        type: place.type,
        rating: place.rating,
        address: place.address,
        description: place.description,
        eventStartAt: place.eventStartAt,
        ticketPrice: place.ticketPrice,
        eventDetails: place.eventDetails,
        coordinates: [place.latitude, place.longitude],
      })),
    };
  }

  private normalizeAiResponse(
    content: string,
    provider: AiRecommendationResponse['provider'],
  ): AiRecommendationResponse {
    const parsed = JSON.parse(content) as Partial<AiRecommendationResponse>;

    return {
      provider,
      summary:
        typeof parsed.summary === 'string'
          ? parsed.summary
          : 'Generated a route from the current map selection.',
      steps: Array.isArray(parsed.steps)
        ? parsed.steps
            .filter(
              (step): step is AiRecommendationStep =>
                typeof step?.title === 'string' &&
                typeof step?.reason === 'string',
            )
            .slice(0, 6)
        : [],
      usedPlaces: Array.isArray(parsed.usedPlaces)
        ? parsed.usedPlaces
            .filter((placeId): placeId is number => typeof placeId === 'number')
            .slice(0, 10)
        : [],
    };
  }

  private buildLocalRecommendation(
    prompt: string,
    places: AiPlaceContextDto[],
    fallbackReason?: string,
  ): AiRecommendationResponse {
    const words = prompt.toLowerCase();
    const preferredTypes = [
      words.includes('coffee') || words.includes('кофе') ? 'CAFE' : null,
      words.includes('food') || words.includes('dinner') || words.includes('еда')
        ? 'RESTAURANT'
        : null,
      words.includes('walk') || words.includes('family') || words.includes('прогул')
        ? 'PARK'
        : null,
      words.includes('event') || words.includes('событ') ? 'EVENT' : null,
    ].filter(Boolean);

    const rankedPlaces = [...places].sort((first, second) => {
      const firstTypeBoost = preferredTypes.includes(first.type) ? 1 : 0;
      const secondTypeBoost = preferredTypes.includes(second.type) ? 1 : 0;

      return second.rating + secondTypeBoost - (first.rating + firstTypeBoost);
    });

    const selectedPlaces = rankedPlaces.slice(0, 4);

    return {
      provider: 'local',
      summary: fallbackReason
        ? 'AI provider is unavailable, so this plan uses ratings, place types, and your current map selection.'
        : 'This plan uses ratings, place types, and your current map selection.',
      steps: selectedPlaces.map((place, index) => ({
        title: `${index + 1}. ${place.title}`,
        reason: `${place.type.toLowerCase()} with rating ${place.rating.toFixed(1)}${
          place.address ? ` near ${place.address}` : ''
        }.`,
      })),
      usedPlaces: selectedPlaces.map((place) => place.id),
      fallbackReason,
    };
  }
}
