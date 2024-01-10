import './App.css';
import { socket } from './socket';
import { useEffect, useState } from 'react'
import useSWRImmutable from 'swr/immutable'

const fetcher = url => fetch(url).then(r => r.json())

function App() {
  const [isConnected, setIsConnected] = useState(false)
  const [input, setInput] = useState('')
  const [chatList, setChatList] = useState([])

  const { data } = useSWRImmutable("http://localhost:4000/chat/0000000000", fetcher)

  useEffect(() => {
    if (data) {
      setChatList(prev => [...prev, ...data.messages])
    }
  }, [data])

  useEffect(() => {
    socket.emit("join", "0000000000")


    socket.on("join", () => {
      console.log('join')
      setIsConnected(true)
    })

    socket.on("message", (message) => {
      console.log('message : ', message)
      setChatList(prev => [...prev, message])
    })

  }, [])


  const sendMessage = () => {
    socket.emit("message", { chatId: "0000000000", message: input })
  }


  return (
    <div style={{ margin: '4rem' }}>
      <h2>
        Chat : {isConnected ? 'Connected' : 'Not Connected'}
      </h2>
      <ul>
        {chatList.map((chat, index) => {
          return <li key={index}>{chat}</li>
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

  );
}

export default App;
