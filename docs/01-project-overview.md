# SafaiNow — Project Overview

## What is SafaiNow?

SafaiNow is an on-demand home cleaning and domestic help platform for Pakistan. It connects customers who need household services with vetted, professional cleaning partners — similar to how Uber connects riders and drivers.

## The Three Players

| Player | Interface | Language | Role |
|---|---|---|---|
| Customer | Mobile App (React Native) | English | Books cleaning services |
| Partner | Mobile App (React Native) | Urdu (RTL) | Executes jobs, collects cash |
| Admin | Web Dashboard (Next.js) | English | Manages entire platform |

## Business Model

- Payment is **cash only** — customer pays partner directly on job completion
- Partner keeps **75%** of each job value
- SafaiNow takes **25% commission** per job
- Admin tracks commission owed per partner and manually marks it as collected
- No payment gateway needed

## Key Principles

- Partners are **never self-registered** — they are vetted and created manually by Admin only
- All services and packages are **fully managed by Admin** from the dashboard
- The Partner App is **fully in Urdu with RTL layout** throughout
- The Customer App is **fully in English**
- Admin has **full real-time visibility** over every booking from the moment it is created
