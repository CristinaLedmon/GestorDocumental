import { Permission } from "./permission";

export type Role = {
  id?: string;
  name: string;
  permissions: Permission[];
};

export type RoleFormActions = {
  id: string;
  message: string;
  errors?: {
    [key: string]: string[];
  };
};
