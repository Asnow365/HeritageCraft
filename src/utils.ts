import { useDispatch, useSelector } from "react-redux";
// import { Dispatch, RootState } from "../../store";
import { INDICATES } from "./assets/mock/constant";
import { BASE_URL, userStateData } from "./services";

// async function fetchUserState(userId: string): Promise<any> {
//   const response = await fetch(`${BASE_URL}/user_state/user/${userId}/state`, {
//     method: "GET",
//     headers: {
//       accept: "application/json",
//     },
//   });

//   if (!response.ok) {
//     throw new Error("Network response was not ok");
//   }

//   return response.json();
// }

// export async function initializeMockData(userId: string) {
//   try {
//     MOCK_DATA = await fetchUserState(userId);
//     console.log(MOCK_DATA); // Just for confirmation
//   } catch (error) {
//     console.error("Failed to fetch MOCK_DATA:", error);
//   }
// }

// Call the function to initialize MOCK_DATA with fetched data
// initializeMockData("tiger");

// export const getImageCandidates = (MOCK_DATA: userStateData) => {
//   const res = MOCK_DATA.image_candidates.map((item) => {
//     const url =
//       item.source === "T2I" ? `${BASE_URL}/${item.image}` : item.image;

//     return {
//       ...item,
//       image: url,
//     };
//   });
//   console.log("image_candidates===", res);

//   return res;
// };

// export const getPerspectiveImages = (id: string | number) => {
//   const target3d = MOCK_DATA.ThreeD_candidates.find(
//     (item) => item.target_id === id
//   );

//   let minRadius = Number.MAX_VALUE;
//   let maxRadius = Number.MIN_VALUE;

//   const res = target3d?.image_id.views.map((item) => {
//     minRadius = Math.min(minRadius, item.threeD_plausibility);
//     maxRadius = Math.max(maxRadius, item.threeD_plausibility);

//     const path =
//       target3d?.image_id.folder_path.search("TripoSR") !== -1
//         ? `${BASE_URL}${
//             target3d.image_id.folder_path.substring(
//               target3d.image_id.folder_path.indexOf(
//                 "/data",
//                 target3d.image_id.folder_path.indexOf("/data") + 1
//               )
//             )
//             // target3d?.image_id.folder_path
//           }/${item.view_id}`
//         : `${BASE_URL}${
//             target3d?.image_id.folder_path.split(".")[1]
//           }/render_512/${item.view_id}`;
//     return {
//       image: `${path}.png`,
//       image_abnormal: `${path}_abnormal.png`,
//       angle: item.view_id * 15,
//       // angle: target3d?.image_id.folder_path.search("TripoSR") !== -1
//       // ? item.view_degree:item.view_id * 45,
//       value: item.threeD_plausibility,
//     };
//   });

//   // console.log("getPerspectiveImages===", res, minRadius, maxRadius);
//   return {
//     perspectiveImages: res ?? [],
//     maxRadius,
//     minRadius,
//   };
// };

// export const getKeyWordIndicates = () => {
//   return INDICATES;
// };

// export const getKeyWordData = () => {
//   const origin = MOCK_DATA.keyword_scores;
//   const res = [];
//   for (let i = 0; i < origin[0].value.length; i++) {
//     const tmp = origin.map((item) => {
//       return {
//         text: item.word,
//         value: item.value[i],
//       };
//     });
//     tmp.sort((a, b) => a.value - b.value);
//     res.push(tmp);
//   }
//   return res;
// };



// export const getParallelData = (id?: string | number) => {
//   // if (!id) return;
//   const target3d = MOCK_DATA.ThreeD_candidates.find(
//     (item) => item.target_id === id
//   );
//   const res = target3d?.image_id.views.map((item) => {
//     return [
//       Number(item.text_image_alignment.toPrecision(2)),
//       Number(item.threeD_plausibility.toPrecision(2)),
//       Number(item.texture_geometry_coherency.toPrecision(2)),
//       Number(item.low_level_texture.toPrecision(2)),
//       Number(item.clip_similarity.toPrecision(2)),
//       Number(item.clip_I.toPrecision(2)),
//       Number(item.color.toPrecision(2)),
//       Number(item.light.toPrecision(2)),
//     ];
//   });

//   console.log("getParallelData===", res);
//   return res;
// };

// export const getMesh = (id?: string | number) => {
//   if (!id) return;

//   const target3d = MOCK_DATA.ThreeD_candidates.find(
//     (item) => item.target_id === id
//   );
//   console.log("getMesh===", target3d?.mesh_path);
//   if (target3d) {
//     let resPath = `${BASE_URL}${target3d.mesh_path}`;
//     // 检查路径中是否包含特定字符串，并移除它
//     const removePath = "/data/threestudio/pp_server";
//     if (target3d.mesh_path.includes(removePath)) {
//       // 直接替换掉需要删除的部分为空字符串，从而移除它
//       resPath = `${BASE_URL}${target3d.mesh_path.replace(removePath, "")}`;
//       console.log("generate", resPath);
//       return resPath;
//     }
//     resPath = `${BASE_URL}${target3d.mesh_path.replace("./", "/")}`;
//     console.log("retrieval", resPath);
//     return resPath;
//   }
// };

// export const getReasons = (id?: string | number) => {
//   if (!id) return;

//   const target3d = MOCK_DATA.ThreeD_candidates.find(
//     (item) => item.target_id === id
//   );
//   return Object.values(target3d?.image_id.views[0].reason ?? {});
// };

// export const getAttentionData = (id?: string | number) => {
//   if (!id) return {} as any;

//   const target3d = MOCK_DATA.ThreeD_candidates.find(
//     (item) => item.target_id === id
//   );
//   const data =
//     target3d?.image_id.prompt_view_score.map((item) => [
//       item[0],
//       `${BASE_URL}${item[1]}`,
//       item[2],
//     ]) ?? [];

//   const labels = new Set();
//   data.forEach((item) => {
//     labels.add(item[0]);
//   });

//   const images = new Set();
//   data.forEach((item) => {
//     images.add(item[1]);
//   });

//   return {
//     texts: Array.from(labels) as string[],
//     imgs: Array.from(images) as string[],
//     ranges: data.map((item) => item[2]) as number[],
//     data: data as any,
//   };
// };
