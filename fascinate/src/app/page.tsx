"use client";
import React, { useEffect, useRef, useState } from 'react';
import { NextPage } from 'next';
import { Box, TextField, IconButton, Typography, Paper } from '@mui/material';
import { DotIcon, SendHorizonalIcon } from "lucide-react";
import { AppBar } from '@/components/AppBar';
import { MainBody } from '@/components/MainBody';
import ReactMarkdown from 'react-markdown';

enum AIState {
  IDLE,
  REQUEST_SENT,
  MESSAGE_RECEIVED,
  ERROR
}

const Home: NextPage = () => {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');
  // const [isLoading, setIsLoading] = useState(false);
  const [aiState, setAIState] = useState(AIState.IDLE);
  const [isWSConnected, setIsWSConnected] = useState(false);
  const websocket = useRef<WebSocket | null>(null);
  const webSocketUrl = process.env.WEB_SOCKET_WSS;

  useEffect(() => {
    const _setUpWss = () => {
      // Initialize WebSocket connection
      websocket.current = new WebSocket(webSocketUrl!);

      websocket.current.onopen = () => {
        setIsWSConnected(true);
        console.log('WebSocket connection established');
      };

      websocket.current.onclose = () => {
        setIsWSConnected(false);
        console.log('WebSocket connection closed');
      };

      websocket.current.onerror = (error) => {
        console.error('WebSocket error:', error);
      };

      websocket.current.onmessage = (event) => {
        console.log('WebSocket message received:', event.data);

        const response = JSON.parse(event.data);
        if (response.result) {
          setAIState(AIState.IDLE);
          setResult(response.result.recommended);
        }
        if (response.message) {
          setAIState(AIState.MESSAGE_RECEIVED);
        }
      };
    }

    if (!webSocketUrl) {
      console.error('Web Socket URL is not defined');
      return;
    }
    _setUpWss();

    return () => {
      websocket.current?.close();
    };
  }, [webSocketUrl]);



  const handleSubmit = () => {
    if (websocket.current && websocket.current.readyState === WebSocket.OPEN) {
      const payload = {
        action: "message",
        message: prompt,
      };
      setPrompt('');
      setAIState(AIState.REQUEST_SENT);
      websocket.current.send(JSON.stringify(payload));
    }
  };

  
  return (
    <>
      <AppBar />
      <MainBody>
        <Box sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          alignItems: 'center',
          minHeight: '100vh',
          backgroundColor: "#212121",
          borderRadius: '16px',
          padding: 4,
        }}>
          <TextField
            variant="outlined"
            placeholder={
              aiState === AIState.IDLE
                ? 'Type your prompt here...'
                : aiState === AIState.MESSAGE_RECEIVED
                  ? "Generating Result..."
                  : "Loading..."
            }
            multiline
            rows={4}
            fullWidth
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            InputProps={{
              endAdornment: (
                <IconButton onClick={handleSubmit} edge="end" disabled={aiState !== AIState.IDLE}>
                  <SendHorizonalIcon />
                </IconButton>
              ),
            }}
            sx={{
              marginBottom: 4,
              '& .MuiOutlinedInput-root': {
                color: 'white',
                backgroundColor: 'rgba(255, 255, 255, 0.05)',
                '& fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.23)',
                },
                '&:hover fieldset': {
                  borderColor: 'rgba(255, 255, 255, 0.5)',
                },
                '&.Mui-focused fieldset': {
                  borderColor: 'primary.main',
                },
              },
              '& .MuiInputBase-input::placeholder': {
                color: 'rgba(255, 255, 255, 0.5)',
                opacity: 1,
              },
            }}
          />

          <Paper
            elevation={3}
            sx={{
              width: '100%',
              minHeight: '200px',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              padding: 2,
              color: 'white',
            }}
          >
            <Typography variant="h6" gutterBottom>Result:</Typography>
            <ReactMarkdown>{result}</ReactMarkdown>
          </Paper>

          <DotIcon color={isWSConnected ? "green" : "red"} size={48} />
        </Box>
      </MainBody>
    </>
  );
}

export default Home;