// static/js/socket.js
import { io } from "https://cdn.socket.io/4.7.5/socket.io.esm.min.js";

const SOCKET_URL = 'http://fes-server.local:5000';
export const socket = io(SOCKET_URL);