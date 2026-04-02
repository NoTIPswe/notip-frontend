export interface Client {
  id: string;
  clientId: string;
  name: string;
  createdAt: string;
}

export interface SecretClient extends Client {
  clientSecret: string;
}
