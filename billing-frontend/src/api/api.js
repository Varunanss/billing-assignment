import axios from "axios";

const API = axios.create({
  baseURL: "https://billing-assignment.onrender.com/",
  timeout: 7000
});

export default API;
