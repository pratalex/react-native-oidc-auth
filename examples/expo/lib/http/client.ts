import Axios from 'axios';
import {API_URL} from '@/constants/api';
import {configAxios} from 'react-native-oidc-auth-expo';
import {expoKeycloak} from '@/lib/oidc-auth';

const axiosInstance = Axios.create({
  baseURL: API_URL,
});

configAxios(expoKeycloak, axiosInstance);

export const axios = axiosInstance;
