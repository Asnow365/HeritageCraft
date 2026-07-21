import * as tiger from "../assets/mock/tiger.json";
import { getUserState, userStateData } from "../services";
import { Dispatch, RootState } from "../store";
import { parameterData } from "./parameter";

const MOCK_DATA = tiger;

export interface storeProps {
  mock_data: userStateData;
}

const initialState: storeProps = {
  mock_data: MOCK_DATA,
};

const mock = {
  state: initialState,

  reducers: {
    updateState(state: storeProps, payload: Partial<storeProps>) {
      return {
        ...state,
        ...payload,
      };
    },
  },

  effects: (dispatch: Dispatch) => ({
    async GetUserState(
      payload: parameterData,
      state: RootState
    ): Promise<void> {
      dispatch.parameter.updateState({
        isShowOverlay: true,
        parameter: payload,
      });

      try {
        const res = await getUserState(payload, payload.promptData);
        console.log("getUserState", res);
        dispatch.mock.updateState({
          mock_data: res,
        });
        dispatch.parameter.updateState({
          isShowOverlay: false,
          selectedImageId: res.ThreeD_candidates?.[0]?.target_id,
        });
      } catch (e) {
        console.warn("API unavailable, using mock data", e);
        // Fall back to initial mock data
        dispatch.mock.updateState({
          mock_data: MOCK_DATA,
        });
        dispatch.parameter.updateState({
          isShowOverlay: false,
          selectedImageId: MOCK_DATA.ThreeD_candidates?.[0]?.target_id,
        });
      }
    },
  }),
};

export default mock;