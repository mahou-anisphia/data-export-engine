export interface IUser {
  id: string;
  email: string;
  authority: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  createdTime: number;
  additionalInfo?: string;
}
