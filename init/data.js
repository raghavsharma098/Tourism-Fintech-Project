const sampleTourismData = [
  {
    userId: "user123",
    destination: "Jaipur",
    interests: ["historical", "nature"],
    budget: 5000,
    startDate: "2024-11-15",
    endDate: "2024-11-16",
    itinerary: [
      {
        date: "2024-11-15",
        location: "Amer Fort",
        category: "historical",
        startTime: "09:00 AM",
        endTime: "12:00 PM",
        estimatedCost: 500
      },
      {
        date: "2024-11-15",
        location: "Jal Mahal",
        category: "nature",
        startTime: "01:00 PM",
        endTime: "03:00 PM",
        estimatedCost: 200
      }
    ],
    expenses: [
      {
        category: "transport",
        amount: 150,
        date: "2024-11-15"
      },
      {
        category: "food",
        amount: 300,
        date: "2024-11-15"
      }
    ],
    totalSpent: 950,
    remainingBudget: 4050,
    paymentMethod: "MetaMask",
    paymentStatus: "completed",
    recommendedLocations: ["City Palace", "Hawa Mahal"]
  },
  {
    userId: "user124",
    destination: "Delhi",
    interests: ["cultural", "adventure"],
    budget: 7000,
    startDate: "2024-11-17",
    endDate: "2024-11-18",
    itinerary: [
      {
        date: "2024-11-17",
        location: "Qutub Minar",
        category: "historical",
        startTime: "10:00 AM",
        endTime: "12:00 PM",
        estimatedCost: 300
      },
      {
        date: "2024-11-17",
        location: "India Gate",
        category: "cultural",
        startTime: "01:00 PM",
        endTime: "03:00 PM",
        estimatedCost: 0
      }
    ],
    expenses: [
      {
        category: "transport",
        amount: 200,
        date: "2024-11-17"
      },
      {
        category: "food",
        amount: 500,
        date: "2024-11-17"
      }
    ],
    totalSpent: 1000,
    remainingBudget: 6000,
    paymentMethod: "Credit Card",
    paymentStatus: "pending",
    recommendedLocations: ["Humayun's Tomb", "Lotus Temple"]
  }
];

module.exports = { data: sampleTourismData };
