import { Trajectory, FailureSignature, Prototype, RunSummary } from "../types/a31";
import { loadRunData, A31ServiceConfig } from "../services/a31Service";
import { Dispatch } from "../store";

export interface A31StoreState {
  trajectories: Trajectory[];
  failures: FailureSignature[];
  prototypes: Prototype[];
  summary: RunSummary | null;
  loaded: boolean;
  loading: boolean;
  error: string | null;
}

const initialState: A31StoreState = {
  trajectories: [],
  failures: [],
  prototypes: [],
  summary: null,
  loaded: false,
  loading: false,
  error: null,
};

const a31 = {
  state: initialState,

  reducers: {
    setData(state: A31StoreState, payload: Partial<A31StoreState>) {
      return { ...state, ...payload, loaded: true, loading: false, error: null };
    },
    setLoading(state: A31StoreState) {
      return { ...state, loading: true, error: null };
    },
    setError(state: A31StoreState, payload: string) {
      return { ...state, error: payload, loaded: false, loading: false };
    },
  },

  effects: (dispatch: Dispatch) => ({
    async loadRunData(payload: A31ServiceConfig) {
      dispatch.a31.setLoading();
      try {
        const data = await loadRunData(payload);
        dispatch.a31.setData(data);
      } catch (e: any) {
        dispatch.a31.setError(e?.message || "Failed to load A31 data");
      }
    },
  }),
};

export default a31;
