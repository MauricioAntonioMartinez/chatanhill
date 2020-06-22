import React, { useEffect } from "react";
import { Stack } from "@chakra-ui/core";
import ChatItem from "./ChatItem/ChatItem";

const Chats = (props) => {
  useEffect(() => {
    //emit incoming messages
  }, []);

  return (
    <Stack spacing={5} border="1px" borderColor="#E6FFFA" overflowY="scroll">
      {props.chats.map((chat, index) => {
        return (
          <ChatItem
            key={index}
            user={chat.users.find((u) => u._id !== props.userId)}
            lastMessage={chat.messages[0]}
            id={chat._id}
          />
        );
      })}
    </Stack>
  );
};

export default Chats;
