import { Field, ObjectType, Int } from '@nestjs/graphql';
import { LeaderboardEntry } from './leaderboard-entry.model';

@ObjectType()
export class LeaderboardResponse {
  @Field(() => [LeaderboardEntry])
  entries: LeaderboardEntry[];

  @Field(() => Int)
  total: number;

  @Field(() => Int)
  page: number;

  @Field(() => Int)
  pageSize: number;

  @Field(() => Int)
  totalPages: number;
} 