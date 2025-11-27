import { Injectable } from "@nestjs/common";
import { IUser } from "src/common";

@Injectable()
export class AuthenticationService {
  private users: IUser[] = [];

  signUp(body: any): number {
    const id = Date.now();

    this.users.push({ id, ...body });

    return id;
  }
}
