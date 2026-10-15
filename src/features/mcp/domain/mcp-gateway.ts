export interface McpGateway {
  issueToken(): Promise<string>
}
