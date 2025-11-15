import { createBrowserRouter, RouterProvider } from "react-router-dom";

export default function App() {
  const router=createBrowserRouter([
    {path:"",element:<div>osama</div>}
  ])




  return <RouterProvider router={router}></RouterProvider>;
}
