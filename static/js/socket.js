// static/js/socket.js (修正版)
import { io } from "https://cdn.socket.io/4.7.5/socket.io.esm.min.js";

const SOCKET_URL = 'http://fes-server.local:5000';
let socket = null;

export const getSocket = () => {
    if (!socket) {
        socket = io(SOCKET_URL);
    }
    return socket;
};