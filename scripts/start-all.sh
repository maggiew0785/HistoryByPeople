#!/usr/bin/env bash
npm --prefix frontend start &      # React dev on :3000
npm --prefix backend  run dev      # nodemon server on :4000
wait
