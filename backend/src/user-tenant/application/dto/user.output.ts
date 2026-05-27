export interface UserOutput {
  id: string;
  email: string;
  fullName: string;
  role: string;
  status: string;
  tenantId: string;
  tenantName?: string;
  createdAt: Date;
}
