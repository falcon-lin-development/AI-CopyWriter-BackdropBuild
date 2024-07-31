"use client";
import React, { useState } from 'react';
import { NextPage } from 'next';
import { Box, TextField, IconButton, Typography, Paper } from '@mui/material';
import {SendHorizonalIcon} from "lucide-react";
import { AppBar } from '@/components/AppBar';
import { MainBody } from '@/components/MainBody';

const Home: NextPage = () => {
  const [prompt, setPrompt] = useState('');
  const [result, setResult] = useState('');

  const handleSubmit = () => {
    // Here you would typically call your AI service
    // For now, we'll just set the result to the prompt
    setResult(prompt);
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
            placeholder='Type your prompt here...'
            multiline
            rows={4}
            fullWidth
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            InputProps={{
              endAdornment: (
                <IconButton onClick={handleSubmit} edge="end">
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
            <Typography>{result}</Typography>
          </Paper>
        </Box>
      </MainBody>
    </>
  );
}

export default Home;