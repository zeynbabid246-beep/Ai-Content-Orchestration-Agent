export interface Channel {
  id: number;
  teamId: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}
 
export interface CreateChannelRequest {
  name: string;
  description?: string;
}
 
export interface UpdateChannelRequest {
  name: string;
  description?: string;
}
 