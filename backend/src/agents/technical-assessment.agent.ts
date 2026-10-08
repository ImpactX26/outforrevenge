import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AiService } from '../ai/ai.service';

export interface CodingChallengeItem {
  title: string;
  description: string;
  language: string;
  starterCode: string;
  solutionTemplate: string;
  testCases: {
    input: string;
    expectedOutput: string;
    description: string;
    isHidden?: boolean;
  }[];
  rubric: {
    criterion: string;
    maxPoints: number;
    description: string;
  }[];
  timeLimitSeconds: number;
}

export interface TechnicalAssessmentPlan {
  title: string;
  description: string;
  roleDomain: string;
  challenges: CodingChallengeItem[];
  confidence: number;
}

@Injectable()
export class TechnicalAssessmentAgent {
  private readonly logger = new Logger(TechnicalAssessmentAgent.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly aiService: AiService,
  ) {}

  async generateAssessment(
    opportunityId: string,
    applicantId: string,
    parentExecutionId?: string,
  ): Promise<TechnicalAssessmentPlan> {
    this.logger.log(`Generating technical assessment for opportunity ${opportunityId} and applicant ${applicantId}`);

    const [opportunity, profile] = await Promise.all([
      this.prisma.opportunity.findUnique({ where: { id: opportunityId } }),
      this.prisma.applicantProfile.findUnique({
        where: { userId: applicantId },
        include: { skills: true },
      }),
    ]);

    if (!opportunity) throw new NotFoundException('Opportunity not found');

    const prompt = `Opportunity:
Title: ${opportunity.title}
Organization: ${opportunity.organization}
Requirements: ${JSON.stringify(opportunity.requirements)}
Description: ${opportunity.description}

Candidate Skills: ${JSON.stringify(profile?.skills?.map(s => s.name) || [])}

Generate a genuine, role-relevant technical assessment with 1-2 coding challenges.
Strict rules:
- NEVER generate irrelevant generic LeetCode brainteasers (e.g., inverted binary tree).
- If Embedded / Firmware: Generate a task like a circular ring buffer, interrupt debouncing, bit manipulation for hardware registers, or CRC-8 in C or C++.
- If Backend: Generate a task like a token bucket rate limiter, payload sanitizer, or cache-aside validator.
- If Frontend: Generate state synchronizer, debounce handler, or form schema validator in TypeScript/JavaScript.
- Include executable starter code, sample test cases (input and expected output as strings), and rubric.`;

    try {
      const res = await this.aiService.runAgentStructured<TechnicalAssessmentPlan>(
        'TECHNICAL_ASSESSMENT',
        applicantId,
        prompt,
        undefined,
        parentExecutionId,
        'ASSESSMENT_FLOW',
      );

      if (res.data?.challenges && res.data.challenges.length > 0) {
        return {
          ...res.data,
          confidence: res.execution?.confidence || 0.92,
        };
      }
    } catch (err: any) {
      this.logger.warn(`AI technical assessment generation fallback: ${err.message}`);
    }

    const isEmbedded = opportunity.title.toLowerCase().includes('firmware') ||
                      opportunity.title.toLowerCase().includes('embedded') ||
                      opportunity.title.toLowerCase().includes('hardware');

    if (isEmbedded) {
      return {
        title: 'Firmware & Embedded Systems Technical Evaluation',
        description: 'Hands-on validation of memory management, interrupt buffers, and bitwise registers.',
        roleDomain: 'EMBEDDED',
        confidence: 0.9,
        challenges: [
          {
            title: 'Circular Ring Buffer for UART ISR',
            description: 'Implement a thread-safe circular ring buffer for incoming microcontroller UART bytes. The buffer has a fixed capacity of 8 bytes. Write the push and pop functions.',
            language: 'c',
            starterCode: `#include <stdio.h>
#include <stdbool.h>

#define BUFFER_SIZE 8

typedef struct {
    char data[BUFFER_SIZE];
    int head;
    int tail;
    int count;
} RingBuffer;

void rb_init(RingBuffer* rb) {
    rb->head = 0;
    rb->tail = 0;
    rb->count = 0;
}

bool rb_push(RingBuffer* rb, char byte) {
    if (rb->count >= BUFFER_SIZE) return false;
    rb->data[rb->head] = byte;
    rb->head = (rb->head + 1) % BUFFER_SIZE;
    rb->count++;
    return true;
}

bool rb_pop(RingBuffer* rb, char* out_byte) {
    if (rb->count <= 0) return false;
    *out_byte = rb->data[rb->tail];
    rb->tail = (rb->tail + 1) % BUFFER_SIZE;
    rb->count--;
    return true;
}

int main() {
    RingBuffer rb;
    rb_init(&rb);
    rb_push(&rb, 'A');
    rb_push(&rb, 'B');
    char c1, c2;
    rb_pop(&rb, &c1);
    rb_pop(&rb, &c2);
    printf("%c%c\\n", c1, c2);
    return 0;
}`,
            solutionTemplate: 'RingBuffer implementation with circular index wrapping.',
            testCases: [
              { input: 'push A, push B, pop, pop', expectedOutput: 'AB', description: 'FIFO order check' },
              { input: 'fill 8 items, check overflow', expectedOutput: 'FULL', description: 'Overflow protection' },
            ],
            rubric: [
              { criterion: 'Boundary condition checking', maxPoints: 30, description: 'Handles empty and full buffer' },
              { criterion: 'Index wrapping', maxPoints: 40, description: 'Correct modulo arithmetic' },
              { criterion: 'Code clarity & safety', maxPoints: 30, description: 'Pointer safety and no memory leaks' },
            ],
            timeLimitSeconds: 600,
          },
        ],
      };
    }

    return {
      title: 'Full-Stack & Backend Systems Evaluation',
      description: 'Hands-on validation of data structures, async flows, and API payload validation.',
      roleDomain: 'BACKEND',
      confidence: 0.88,
      challenges: [
        {
          title: 'Token Bucket Rate Limiter',
          description: 'Implement a Token Bucket Rate Limiter that allows bursts up to maxTokens and refills at refillRatePerSecond.',
          language: 'typescript',
          starterCode: `export class TokenBucket {
  private capacity: number;
  private refillRate: number;
  private tokens: number;
  private lastRefill: number;

  constructor(capacity: number, refillRatePerSec: number) {
    this.capacity = capacity;
    this.refillRate = refillRatePerSec;
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  tryConsume(tokensNeeded = 1): boolean {
    const now = Date.now();
    const elapsedSeconds = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(this.capacity, this.tokens + elapsedSeconds * this.refillRate);
    this.lastRefill = now;

    if (this.tokens >= tokensNeeded) {
      this.tokens -= tokensNeeded;
      return true;
    }
    return false;
  }
}

const limiter = new TokenBucket(5, 1);
console.log(limiter.tryConsume(1) ? "ALLOWED" : "REJECTED");`,
          solutionTemplate: 'Token bucket with timestamp diff calculation.',
          testCases: [
            { input: 'tryConsume 1 with initial bucket', expectedOutput: 'ALLOWED', description: 'Permits allowed tokens' },
            { input: 'consume over capacity', expectedOutput: 'REJECTED', description: 'Blocks excessive requests' },
          ],
          rubric: [
            { criterion: 'Token calculation accuracy', maxPoints: 40, description: 'Correct elapsed time calculation' },
            { criterion: 'State management', maxPoints: 30, description: 'Respects maximum capacity bound' },
            { criterion: 'Clean TypeScript typing', maxPoints: 30, description: 'Type safety and edge cases' },
          ],
          timeLimitSeconds: 600,
        },
      ],
    };
  }
}
