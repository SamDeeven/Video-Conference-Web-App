import React, {createContext, useState, useRef, useEffect} from 'react';
import {io} from 'socket.io-client';
import Peer from 'simple-peer';


const SocketContext  = createContext();


// passing server url
const socket = io('http://localhost:5000');

// getting children from props
const ContextProvider = ({children}) =>{
    const [stream, setStream] = useState(null);
    const [me,setMe] = useState('');
    const [call,setCall] = useState({});
    const [callAccepted,setCallAccepted] = useState(false);
    const [callEnded, setCallEnded] = useState(false);
    const [name, setName] = useState('');

    const myVideo = useRef();
    const userVideo = useRef();
    const connectionRef = useRef();


    // After the page loads, it should ask the user to allow camera and mic
    // with an empty dependency array
    useEffect(()=>{
        navigator.mediaDevices.getUserMedia({video:true , audio:true})
        .then((currentStream)=>{
            setStream(currentStream);

            //setting the currentStream also to Ref
            myVideo.current.srcObject = currentStream   //    const myVideo = useRef();
        })

        // listening for the self id
        socket.on("me",(id)=> setMe(id));

        // getting data like from, name, signal from the user
        socket.on('call-user',({from, name:callerName, signal})=>{
            // sometimes user receives calls, sometimes makes calls
            // setting this in peer
            setCall({isReceivedCall: true, from,name:callerName,signal})

        })


    },[])



    // functions for the video call --> using these functions in useState()
    // These are the 3 actions
    const answerCall = ()=>{

        setCallAccepted(true)

        // Peer behaves similarly to socket. have actions and handlers once there is any function call
        const peer = new Peer({
            initiator:false,  // because it is not about answering call
            trickle:false, 
            stream  // initialised a state above
        })
        // once signal is received, getting the data from that signal
        peer.on('signal',(data)=>{
            socket.emit('answer-call',{signal: data, to: call.from})
        })

        // current stream
        // setting others video stream Ref
        peer.on('stream',(currentStream)=>{
            // useRef
            userVideo.current.srcObject = currentStream;   //   const userVideo = useRef();
        })

        // call is from socket(in useEffect) once we call the user
        // there we have the info like name, from, signal
        peer.signal(call.signal)

        // current connection is equal to current peer who is inside the connection
        connectionRef.current = peer;  //      const connectionRef = useRef();
    }

    const callUser = (id)=>{
        // Peer behaves similarly to socket. have actions and handlers once there is any function call
        const peer = new Peer({
            initiator:true,  // because it is about answering call
            trickle:false, 
            stream  // initialised a state above
        })

        // once signal is received, getting the data from that signal
        peer.on('signal',(data)=>{
            // user cal accept or answer the call
            socket.emit('call-user',{userToCall: id, signalData: data, from: me, name})
        })

        // current stream
        // setting others video stream Ref
        peer.on('stream',(currentStream)=>{
            // useRef
            userVideo.current.srcObject = currentStream;   //   const userVideo = useRef();
        })

        socket.on('call-accepted', (signal)=>{
            setCallAccepted(true);

            peer.signal(signal);
        })

        // current connection is equal to current peer who is inside the connection
        connectionRef.current = peer;  //      const connectionRef = useRef();

    }

    const endCall = () =>{

        setCallEnded(true);
        connectionRef.current.destroy();

        // after ending call, it reloads the page and gives a new id again (in useEffect)
        window.location.reload();

    }


    return (
        // everything we pass in the value will be accessed to all the components
        // all data of state and functions

        <SocketContext.Provider value={{
            call,
            callAccepted,
            myVideo,
            userVideo,
            stream,
            name,
            setName,
            callUser,
            callEnded,
            endCall,
            answerCall,
            me
        }}>

             {/* all the components are wrapped inside SocketContext */}
            {children}

        </SocketContext.Provider>
    )

}


export {ContextProvider, SocketContext}