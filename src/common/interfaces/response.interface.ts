interface IResponse<T = any> {
  success: boolean;
  message: string;
  data?: T;
}
export default IResponse;
