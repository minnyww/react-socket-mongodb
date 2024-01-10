import './App.css';
import { socket } from './socket';
import { useEffect, useState } from 'react'
import useSWRImmutable from 'swr/immutable'

const fetcher = url => fetch(url).then(r => r.json())

function App() {
  const [isConnected, setIsConnected] = useState(false)
  const [input, setInput] = useState('')
  const [chatList, setChatList] = useState([])
  const [tmpUserName, setTmpUserName] = useState("")
  const [userInRoom, setUserInRoom] = useState([])

  const { data } = useSWRImmutable(isConnected ? "https://bdb8-124-120-193-26.ngrok-free.app/chat/0000000000" : null, fetcher)


  useEffect(() => {
    const userName = localStorage.getItem('userName')
    if (userName) {
      setIsConnected(true)
      setTmpUserName(userName)
      userJoinRoom()
    }
  }, [])

  useEffect(() => {
    if (data) {
      setChatList(prev => [...prev, ...data.messages])
      setUserInRoom(prev => [...prev, ...data.userInGroup])
    }
  }, [data])

  useEffect(() => {
    socket.on("join", () => {
      console.log('join')
      setIsConnected(true)
    })

    socket.on("message", (message) => {
      console.log('message : ', message)
      setChatList(prev => [...prev, message])
    })

    socket.on("joinRoom", (userName) => {
      console.log('userName : ', userName)
    })

  }, [])


  const sendMessage = () => {
    socket.emit("message", { chatId: "0000000000", message: input, userName: tmpUserName })
  }

  const userJoinRoom = () => {
    socket.emit("join", "0000000000")
    socket.emit("joinRoom", { chatId: "0000000000", userName: tmpUserName })
    localStorage.setItem('userName', tmpUserName)
  }


  return (
    <div style={{ margin: '4rem' }}>
      <h2>
        Hi {`"${tmpUserName}"`} : {isConnected ? 'Connected' : 'Not Connected'}
      </h2>
      <input value={tmpUserName} placeholder='enter user name' onChange={({ target: { value } }) => setTmpUserName(value)} />
      <button onClick={() => userJoinRoom()}>change user name</button>
      <div style={{ display: 'flex', justifyContent: 'space-between', width: '50%' }}>
        <div>
          <h4>User In Room</h4>
          {userInRoom?.map((user, index) => {
            return <div key={index}>{`${user} Join Room `}</div>
          })}
        </div>
        <div>
          <ul>
            {chatList.map((chat, index) => {
              return <li key={index}>{chat.userName} : {chat?.message}</li>
            })}
          </ul>
          <input type="text" placeholder='enter text' onChange={({ target: { value } }) => setInput(value)} />
          <button
            onClick={() => {
              sendMessage()
            }}>
            send
          </button>
        </div>
      </div>
    </div>

  );
}

export default App;
