import Axios from 'axios';
import {API_URL} from '@env';
import {configAxios} from 'react-native-oidc-auth';
import {oidcAuth} from '../oidc-auth.ts';

const axiosInstance = Axios.create({
  baseURL: API_URL,
});

configAxios(oidcAuth, axiosInstance);

export const axios = axiosInstance;
