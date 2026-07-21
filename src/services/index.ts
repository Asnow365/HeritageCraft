import axios from "axios";
import { parameterData } from "../models/parameter";

export const BASE_URL = "http://8.210.55.185:49267";

export const MOCK_URL = "http://8.210.55.185:49267";
axios.defaults.baseURL = MOCK_URL;

export interface ImageCandidatesData {
  id: number;
  source: string;
  prompt: string;
  x: number;
  y: number;
  image: string;
  external_link: string;
}
export interface PromptCandidatesData {
  text: string;
  value: number;
}

export interface userStateData {
  interface_params: any;
  current_prompt: string;
  prompt_candidates: PromptCandidatesData[] | any[];
  image_candidates: ImageCandidatesData[] | any[];
  ThreeD_candidates: any[];
  keyword_scores: any[];
}

export const getUserState = async (
  parameter: parameterData,
  user_id = "VIS2024_0325"
): Promise<userStateData> => {
  console.log("getUserState", parameter);
  return new Promise((resolve, reject) => {
    axios
      .get(`/user_state/user/state`, {
        params: {
          ...parameter,
        },
      })
      .then((res) => {
        resolve(res.data);
      })
      .catch((err) => {
        reject(err.data);
      });
  });
};