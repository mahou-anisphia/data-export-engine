export interface IUser {
  id: string;
  email: string;
  authority: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  tenant_id: string;
  createdTime: number;
  additionalInfo?: string;
}
