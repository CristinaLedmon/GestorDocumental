"use client"

import { Calendar, Clock } from "lucide-react"
import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"

export function WelcomeCard() {
  const [currentDate, setCurrentDate] = useState(new Date())

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDate(new Date())
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  const currentHour = currentDate.getHours()

  const getGreeting = () => {
    if (currentHour < 12) return "Buenos días"
    if (currentHour < 20) return "Buenas tardes"
    return "Buenas noches"
  }

  const greeting = getGreeting()

  const formattedDate = currentDate.toLocaleDateString('es-ES', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })

  const formattedTime = currentDate.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  })

  return (
    <Card className="mb-8 border shadow-sm">
      <CardContent className="p-5">
        <div className="flex flex-col sm:flex-row justify-between items-center">
          <div>
            <h2 className="text-2xl font-medium">{greeting}</h2>
            <p className="text-white-700 dark:text-white-400">Bienvenid@ al sistema de gestión</p>
          </div>
          <div className="flex items-center mt-4 sm:mt-0">
            <div className="mr-2">
              <Calendar className="h-5 w-5" />
            </div>
            <span className="mr-4">{formattedDate}</span>
            <div className="mr-2">
              <Clock className="h-5 w-5" />
            </div>
            <span>{formattedTime}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}