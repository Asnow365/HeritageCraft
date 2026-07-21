import { Dispatch } from "../store";

export interface parameterData {
  user_id: string;
  promptData: string;
  negativePromptData: string;
  numberOfGeneration: number;
}

export interface storeProps {
  image_candidates: any[];
  parameter: parameterData;
  isShowOverlay: boolean;
  showCoordinate: boolean;
  selectedImageId?: number | string;
  hoverWord?: string;
  currentImage?: any;
}

const initialState: storeProps = {
  image_candidates: [],
  parameter: {
    user_id: "",
    promptData: "",
    negativePromptData: "",
    numberOfGeneration: 0,
  },
  isShowOverlay: false,
  showCoordinate: true,
  selectedImageId: "",
};

const parameter = {
  state: initialState,

  reducers: {
    updateState(state: storeProps, payload: Partial<storeProps>) {
      return {
        ...state,
        ...payload,
      };
    },

    updateParameterState(state: storeProps, payload: Partial<parameterData>) {
      return {
        ...state,
        parameter: { ...state.parameter, ...payload },
      };
    },

    // 扩展prompt
    appendPrompt(state: storeProps, payload: Partial<string>) {
      return {
        ...state,
        parameter: {
          ...state.parameter,
          promptData: state.parameter.promptData
            ? state.parameter.promptData + `, ${payload}`
            : payload,
        },
      };
    },
  },

  effects: (dispatch: Dispatch) => ({}),
};

export default parameter;