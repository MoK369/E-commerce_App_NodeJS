import { IResponse } from 'src/common/interfaces';

const successResponseHandler = <T = any>({
  message = 'Done ✅',
  data,
}: Omit<Partial<IResponse<T>>, 'success'> = {}): IResponse => {
  return { success: true, message, data };
};

export default successResponseHandler;
