import React, { useState } from "react";
import { useEffect } from "react";
import io from 'socket.io-client';
import { useLocation, useNavigate } from 'react-router-dom';
import EmojiPicker from "emoji-picker-react";

import styles from "../styles/Chat.module.css"
import emoji from "../images/emoji.png";
import Messages from "./Messages";





const socket = io.connect('http://localhost:5000')

const Chat = () => { 
   const { search } = useLocation();
   const navigate = useNavigate();
   const [params, setParams] = useState({room: "", user:""});
   const [state, setState] = useState([]);
   const [message, setMesage] = useState("");
   const [isOpen, setOpen] = useState(false);
   const [users, setUsers] = useState(0);
   const [isTyping, setIsTyping] = useState(false);
   
   

   useEffect(() => {
      const searchParams = Object.fromEntries(new URLSearchParams(search));
      setParams(searchParams);
      socket.emit("join", searchParams);
    }, [search]);

    useEffect(() => {
      socket.on("message", ({ data }) => {
        setState((_state) => [..._state, data]);
        console.log(data);
      });
      

      socket.on('typing', (userName, room) => {
        // Отправляем событие typing на сервер
        socket.emit('typing', { name: userName, isTyping: true });
      });
      socket.on('stopTyping', (userName, room) => {
         // Отправляем событие stopTyping на сервер
         socket.emit('stopTyping', { name: userName, isTyping: false });
       });
 
     }, []);

   useEffect(() => {
      socket.on("room", ({ data: { users } }) => {
        setUsers(users.length);
      });
    }, []);

   
   console.log(state);

   const leftRoom = () => {
      socket.emit("leftRoom", { params });
      navigate("/");
    };


    const handleChange = ({ target: { value } }) => {
      setMesage(value);
      handleTyping(); // Вызываем функцию обработки печати при изменении текста
    };
    
   

   const handleSubmit = (e) => {
      e.preventDefault();
      
      if(!message) return;

      socket.emit("sendMessage", {message, params});

      setMesage("");
   };

   const handleTyping = () => {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
      }, 2000); // устанавливаем таймер на 2 секунды
    };
    

   const onEmojiClick = ({emoji}) => setMesage(`${message} ${emoji}`);

   function getDeclension(usersCount) {
      if (users === 1) {
          return 'пользователь';
      } else if (usersCount >= 2 && usersCount <= 4) {
          return 'пользователя';
      } else {
          return 'пользователей';
      }
  }


   return(
      <div className={styles.wrap}>
         <div className={styles.header}>
             <div className={styles.title}>
               {params.room}
             </div>
             {isTyping && !state.some((msg) => msg.name === params.name) && (
    <p>{params.name} печатает...</p>
)}

             <div className={styles.users}>
             {users} {getDeclension(users)} в этой комнате
             </div>
             <button className={styles.left} onClick={leftRoom}>
               Покинуть комнату
             </button>
         </div>
         <div className={styles.messages} >
            <Messages messages = {state} name={params.name} />
         </div>
         

         <form className={styles.form} onSubmit={handleSubmit}>
         
            <div className={styles.input}>
            <input 
               type="text" 
               name="message" 
               placeholder="Ваше сообщение"
               value={message}
               onChange={handleChange}
               autoComplete="off"
               required
            />       
            </div>

            <div className={styles.emoji}>
               <img src={emoji} alt="" onClick={() => setOpen(!isOpen)}/>

               {isOpen &&(
                  <div className={styles.emojies}>
                     <EmojiPicker onEmojiClick={onEmojiClick}/>
                  </div>
               )}
            </div>

            <div className="styles.button">
               <input type="submit" onSubmit={handleSubmit} value="Отправить сообщение"/>
            </div>
         </form>
         
      </div>
   );
};

export default Chat;