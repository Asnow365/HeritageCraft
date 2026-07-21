import { Provider, useDispatch, useSelector } from "react-redux";
import MainInterface from "./modules/index";
import { store, Dispatch } from "./store";
import { useEffect } from "react";

const AppInner = () => {
  const dispatch = useDispatch<Dispatch>();
  const { loaded, error } = useSelector((state: any) => state.a31);

  useEffect(() => {
    dispatch.a31.loadRunData({
      artifactsRoot: `${import.meta.env.BASE_URL}data/a31-mock`,
    });
  }, []);

  return <MainInterface />;
};

export const App = function () {
  return (
    <Provider store={store}>
      <AppInner />
    </Provider>
  );
};
export default App;