import { Field, ObjectType, Int, Float } from '@nestjs/graphql';
import { GraphQLJSON } from 'graphql-type-json';

@ObjectType()
export class LeaderboardEntry {
  @Field()
  id: string;

  @Field()
  tenantId: string;

  @Field({ nullable: true })
  userId?: string;

  @Field()
  casinoPlayerId: string;

  @Field()
  casino: string;

  @Field(() => Float)
  wagerAmount: number;

  @Field(() => Int)
  rank: number;

  @Field()
  timestamp: Date;

  @Field(() => GraphQLJSON)
  data: any;
} 