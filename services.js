// Basketball Service for handling real-time data
const basketballService = {
    listeners: new Map(),
    baseUrl: 'https://api.balldontlie.io/v1',
    REFRESH_INTERVAL: 30000, // 30 seconds

    async fetchWithRetry(endpoint, retries = 3) {
        for (let i = 0; i < retries; i++) {
            try {
                const response = await fetch(`${this.baseUrl}/${endpoint}`);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
                return await response.json();
            } catch (error) {
                console.warn(`Attempt ${i + 1} failed: ${error.message}`);
                if (i === retries - 1) throw error;
                await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
            }
        }
    },

    // Event handling
    subscribe(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    },

    notify(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => callback(data));
        }
    },

    // Live Games
    async getLiveGames() {
        try {
            const response = await this.fetchWithRetry('games?per_page=100&seasons[]=2024');
            const data = await response;
            const today = new Date();
            
            // Filter games happening today
            const todayGames = data.data.filter(game => {
                const gameDate = new Date(game.date);
                return gameDate.toDateString() === today.toDateString();
            });

            const formattedGames = todayGames.map(game => ({
                id: game.id,
                homeTeam: game.home_team.full_name,
                homeScore: game.home_team_score,
                awayTeam: game.visitor_team.full_name,
                awayScore: game.visitor_team_score,
                status: game.status,
                period: game.period
            }));

            this.notify('liveGamesUpdated', formattedGames);
            return formattedGames;
        } catch (error) {
            console.error('Error fetching live games:', error);
            return [];
        }
    },

    // Player Statistics
    async getPlayerStats(searchQuery) {
        try {
            const response = await this.fetchWithRetry(`players?search=${searchQuery}`);
            const data = await response;
            
            const playerStats = await Promise.all(data.data.map(async player => {
                const statsResponse = await this.fetchWithRetry(`season_averages?player_ids[]=${player.id}`);
                const statsData = await statsResponse;
                const stats = statsData.data[0] || {};
                
                return {
                    id: player.id,
                    name: `${player.first_name} ${player.last_name}`,
                    team: player.team.full_name,
                    position: player.position,
                    ppg: stats.pts || 0,
                    rpg: stats.reb || 0,
                    apg: stats.ast || 0,
                    fgPercentage: stats.fg_pct ? (stats.fg_pct * 100).toFixed(1) : 0
                };
            }));

            this.notify('playerStatsUpdated', playerStats);
            return playerStats;
        } catch (error) {
            console.error('Error fetching player stats:', error);
            return [];
        }
    },

    // Team Statistics
    async getTeamStats(teamId) {
        try {
            const response = await this.fetchWithRetry(`teams/${teamId}`);
            const teamData = await response;

            // Get team's games
            const gamesResponse = await this.fetchWithRetry(`games?team_ids[]=${teamId}&per_page=100`);
            const gamesData = await gamesResponse;
            
            // Calculate team statistics from games
            const stats = this.calculateTeamStats(gamesData.data, teamId);
            
            const teamStats = {
                id: teamData.id,
                name: teamData.full_name,
                conference: teamData.conference,
                division: teamData.division,
                ...stats
            };

            this.notify('teamStatsUpdated', teamStats);
            return teamStats;
        } catch (error) {
            console.error('Error fetching team stats:', error);
            return null;
        }
    },

    calculateTeamStats(games, teamId) {
        let totalPoints = 0;
        let totalRebounds = 0;
        let totalAssists = 0;
        let wins = 0;
        let totalGames = games.length;

        games.forEach(game => {
            const isHomeTeam = game.home_team.id === teamId;
            const teamScore = isHomeTeam ? game.home_team_score : game.visitor_team_score;
            const opponentScore = isHomeTeam ? game.visitor_team_score : game.home_team_score;

            totalPoints += teamScore;
            // Estimate rebounds and assists based on score
            totalRebounds += Math.round(teamScore * 0.8);
            totalAssists += Math.round(teamScore * 0.4);

            if (teamScore > opponentScore) wins++;
        });

        return {
            ppg: totalGames ? (totalPoints / totalGames).toFixed(1) : 0,
            rpg: totalGames ? (totalRebounds / totalGames).toFixed(1) : 0,
            apg: totalGames ? (totalAssists / totalGames).toFixed(1) : 0,
            winRate: totalGames ? (wins / totalGames).toFixed(3) : 0
        };
    },

    // Schedule
    async getUpcomingGames() {
        try {
            const today = new Date();
            const response = await this.fetchWithRetry(`games?start_date=${today.toISOString().split('T')[0]}`);
            const data = await response;

            const formattedGames = data.data.map(game => ({
                id: game.id,
                homeTeam: game.home_team.full_name,
                awayTeam: game.visitor_team.full_name,
                date: new Date(game.date),
                status: game.status,
                arena: 'TBD' // API doesn't provide arena info
            }));

            this.notify('scheduleUpdated', formattedGames);
            return formattedGames;
        } catch (error) {
            console.error('Error fetching schedule:', error);
            return [];
        }
    },

    // Start real-time updates
    startLiveUpdates() {
        setInterval(async () => {
            try {
                const games = await this.getLiveGames();
                this.notify('liveGamesUpdated', games);
            } catch (error) {
                console.error('Error in live updates:', error);
            }
        }, this.REFRESH_INTERVAL);
    }
};
