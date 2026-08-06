import { Injectable } from '@nestjs/common';
import { ClientTimelinesRepository } from './client-timelines.repository';

@Injectable()
export class ClientTimelinesService {
  constructor(private readonly repository: ClientTimelinesRepository) {}

  async getMany(clientId: string) {
    return this.repository.findMany(clientId);
  }
}
