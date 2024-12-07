import express from "express";
import http from "http";
import { WebSocketServer } from "ws";
import path from "path";
import Redis from "ioredis";

const app = express();
const server = http.createServer(app);

const wss = new WebSocketServer({ server });
const redis = new Redis();

app.use(express.static(path.join(process.cwd(), "public")));

const getUserCount = async () => {
  try {
    const roomData = await redis.hget("ROOMS", "roomName1");
    const roomObj = JSON.parse(roomData);
    const userCount = Object.keys(roomObj).length;

    console.log(`Number of users on roomName1 : ${userCount}`);
  } catch (err) {
    console.error("ERROR : ", err);
  } finally {
    // redis.quit();
  }
};

function sendMessageToUser(userId, message) {
  const socketId = `user:socket:${userId}`;

  // Redis에서 WebSocket 상태 정보 가져오기
  redis.get(socketId, (err, data) => {
    if (err || !data) {
      console.error("WebSocket not found");
      return;
    }

    const { readyState, remoteAddress, socket } = JSON.parse(data);

    // WebSocket 연결이 OPEN 상태일 경우 메시지 전송
    if (readyState === WebSocket.OPEN) {
      // wss.clients를 배열로 변환하여 찾기
      const targetSocket = Array.from(wss.clients).find((client) => client._socket.remoteAddress === remoteAddress);
      if (targetSocket && targetSocket.readyState === WebSocket.OPEN) {
        targetSocket.send(JSON.stringify({ type: "join", data: message }));
      }
    } else {
      console.log("WebSocket is not open");
    }
  });
}

wss.on("connection", async (socket, req) => {
  console.log("A new client connected");
  // await getUserCount();

  // const userId = Math.random().toString(36).substring(2);
  /*
  const socketId = `user:socket:${userId}`;

  // WebSocket 연결 상태를 Redis에 저장
  redis.set(
    socketId,
    JSON.stringify({
      readyState: socket.readyState, // WebSocket의 상태 저장
      remoteAddress: socket._socket.remoteAddress, // 클라이언트의 IP 주소 등 추가 정보 저장
      socket
    })
  );

  sendMessageToUser(userId, "hello");
  */

  const aaaLength = Array.from(wss.clients).filter((client) => {
    return client.id === "aaa";
  });

  if (aaaLength.length === 0) {
    socket.id = "aaa";
  } else {
    socket.id = "bbb";
  }

  const aaaSocket = Array.from(wss.clients).find((client) => {
    return client.id === "aaa";
  });

  aaaSocket.send(JSON.stringify({ type: "join", data: "HELLO AAA~~~~" }));

  socket.on("close", () => {
    redis.del(socket.id); // 연결 종료 시 Redis에서 해당 데이터 삭제
  });
});

// 서버 시작
server.listen(3000, () => {
  console.log("Server running on http://localhost:3000");
});
