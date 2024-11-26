export interface IUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  createdTime: number;
  additionalInfo?: string;
}
