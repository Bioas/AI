import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import RoomDetailDaily from './RoomDetailDaily'
import RoomDetailMonthly from './RoomDetailMonthly'

export default function RoomDetail() {
  const { id } = useParams()
  const { rooms } = useApp()

  const room = useMemo(() => rooms.find(r => r.id === id), [rooms, id])

  if (!room) return null

  const isDaily = room.rentalType === 'รายวัน'

  return isDaily ? <RoomDetailDaily /> : <RoomDetailMonthly />
}
