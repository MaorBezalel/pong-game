// ----------------------------------- OBJECTS ----------------------------------- //

// Object that contain the default setting values of various objects in the game
const SETTINGS = {
    CANVAS_WIDTH: 1220,
    CANVAS_HEIGHT: 720,
    CANVAS_BACKGROUND_COLOR: "hsl(210, 30%, 24%)",
    
    BALL_WIDTH: 16,
    BALL_HEIGHT: 16,
    BALL_SPEED: 9,
    BALL_COLOR: "hsl(0, 100%, 100%)",
    
    PADDLE_WIDTH: 15,
    PADDLE_HEIGHT: 67,
    PADDLE_X_OFFSET: 90,
    PADDLE_COLOR: "hsl(0, 100%, 100%)",
    USER_PADDLE_SPEED: 10,
    AI_PADDLE_SPEED: 7.69,
    
    LINE_DASH: [10, 25],
    LINE_Y_OFFSET: 70,
    LINE_WIDTH: 10,
    LINE_COLOR: "hsl(0, 100%, 100%)",
    
    SCORE_TEXT_FONT: "40px Courier New",
    SCORE_TEXT_ALIGNMENT: "center",
    SCORE_TEXT_COLOR: "hsl(0, 100%, 100%)",
    SCORE_TEXT_X_OFFSET: 300,
    SCORE_TEXT_HEIGHT: 80,
    SCORE_TO_WIN: 3,
    
    ROUND_SCORE_TEXT_FONT: "25px Courier New",
    ROUND_SCORE_TEXT_ALIGNMENT: "center",
    ROUND_SCORE_TEXT_COLOR: "hsl(0, 100%, 100%)",
    ROUND_SCORE_TEXT_X_OFFSET: 300,
    ROUND_SCORE_TEXT_HEIGHT: 50,
};

// Object that contain the audio files used in the game
const AUDIO = {
    PADDLE_BALL_COLLSION: new Audio("./pong-game/audio/paddle-ball-collision.wav"),
    SCORE: new Audio("./pong-game/audio/score.wav"),
    WIN: new Audio("./pong-game/audio/winner.wav"),
    GAME_OVER: new Audio("./pong-game/audio/game-over.wav")
};

// Enum that represent the direction of the paddles and the ball
const DIRECTION = {
    IDLE: 0,
    UP: 1,
    DOWN: 2,
    LEFT: 3,
    RIGHT: 4
};

// Enum that represent the different keys that can be pressed by the user
// (The enum's string values correspond to the KeyboardEvent.key property)
const KEY = {
    W: "w",
    S: "s",
    ARROW_UP: "ArrowUp",
    ARROW_DOWN: "ArrowDown"
};

// The ball object (The cube that bounces back and forth)
const Ball = {
    new: function (currentRoundBallSpeed) {
        return {
            width: SETTINGS.BALL_WIDTH,
            height: SETTINGS.BALL_HEIGHT,
            x: this.canvas.width / 2 - (SETTINGS.BALL_WIDTH / 2),
            y: this.canvas.height / 2 - (SETTINGS.BALL_HEIGHT / 2),
            moveX: DIRECTION.IDLE,
            moveY: DIRECTION.IDLE,
            speed: SETTINGS.BALL_SPEED || currentRoundBallSpeed
        };
    }
};

// The paddle object (The two lines that move up and down)
const Paddle = {
    new: function (side, paddleSpeed) {
        return {
            width: SETTINGS.PADDLE_WIDTH,
            height: SETTINGS.PADDLE_HEIGHT,
            x: side === "left" ? SETTINGS.PADDLE_X_OFFSET : this.canvas.width - SETTINGS.PADDLE_X_OFFSET,
            y: this.canvas.height / 2 - (SETTINGS.PADDLE_HEIGHT / 2),
            score: 0,
            move: DIRECTION.IDLE,
            speed: paddleSpeed
        };
    }
};

const Game = {
    start: function () {
        this.canvas = document.querySelector("canvas");
        this.context = this.canvas.getContext("2d");

        this.canvas.width = SETTINGS.CANVAS_WIDTH;
        this.canvas.height = SETTINGS.CANVAS_HEIGHT;
        this.color = SETTINGS.CANVAS_BACKGROUND_COLOR;

        this.user = Paddle.new.call(this, "left", SETTINGS.USER_PADDLE_SPEED);
        this.ai = Paddle.new.call(this, "right", SETTINGS.AI_PADDLE_SPEED);

        this.ball = Ball.new.call(this);

        this.isRunning = false;
        this.isOver = false;
        
        this.previousLoser = null;
        this.timer = 0;

        this.displayMenu();
        this.listenToUserInput();
    },

    displayMenu: function () {
        this.drawAllTheGameObjects();
        this.drawGameStartInstruction();
    },

    displayEndGameMenu: function (text) {
        if (text === "You Won! :D") {  
            AUDIO.WIN.play();
        } else {
            AUDIO.GAME_OVER.play();
        }

        this.context.fillStyle = SETTINGS.CANVAS_BACKGROUND_COLOR;
        this.context.fillRect(
            this.canvas.width / 2 - 350,
			this.canvas.height / 2 - 48,
			700,
			100
        );

        this.context.font = SETTINGS.SCORE_TEXT_FONT;
        this.context.fillStyle = SETTINGS.SCORE_TEXT_COLOR;
        this.context.fillText(
            text,
            this.canvas.width / 2,
            this.canvas.height / 2
        );

		setTimeout(() => Game.start(), 3000);
	},

    listenToUserInput: function () {
        document.addEventListener("keydown", (event) => {
            if (!Game.isRunning) {
                Game.isRunning = true;
                window.requestAnimationFrame(Game.loop);
            }
            
            // Handle 'w' and '↑' keys events (move the user paddle up)
			if (event.key === KEY.W || event.key === KEY.ARROW_UP) {
                Game.user.move = DIRECTION.UP;
            }

			// Handle 's' and '↓' keys events (move the user paddle down)
			if (event.key === KEY.S || event.key === KEY.ARROW_DOWN) {
                Game.user.move = DIRECTION.DOWN;
            }
        });

        document.addEventListener("keyup", (event) => {
            Game.user.move = DIRECTION.IDLE;
        });
    },

    loop: function () {
        Game.update();
        Game.drawAllTheGameObjects();

        if (!Game.isOver) {
            window.requestAnimationFrame(Game.loop);
        }
    },

    update: function () {
        if (!this.over) {
            this.handleBallLeftRightCollision();
            this.handleBallTopBottomCollision();

            if (this.didWeStartANewMatch()) {
                this.sendTheBallToThePreviousMatchLoser();
            }

            this.handleUserPaddleMovement();
            this.handleUserPaddleTopBottomCollision();
            this.handleBallMovement();
            this.handleAIPaddleMovement();
            this.handleAIPaddleTopBottomCollision();
            this.handlePaddleBallCollision();
        }
        
        if (this.didSomeoneWonTheGame()) {
            this.isOver = true;

            const winner = this.user.score === SETTINGS.SCORE_TO_WIN ? this.user : this.ai;
            setTimeout(() => {
                this.displayEndGameMenu(`${winner === this.user ? "You Won! :D" : "Game Over! ;("}`);
            }, 0);
        }
    },

    didSomeoneWonTheGame: function () {
        const didUserWinTheGame = this.user.score === SETTINGS.SCORE_TO_WIN;
        const didAIWinTheGame = this.ai.score === SETTINGS.SCORE_TO_WIN;

        return didUserWinTheGame || didAIWinTheGame;
    },

    handleBallLeftRightCollision: function () {
        const didBallLeaveThroughLeftBoundary = this.ball.x <= 0;
        if (didBallLeaveThroughLeftBoundary) {
            const winner = this.ai;
            const loser = this.user;
            this.handleWinnerLoser(winner, loser);

            if (winner.score !== SETTINGS.SCORE_TO_WIN) {
                AUDIO.SCORE.play();
            }
        }

        const didBallLeaveThroughRightBoundary = this.ball.x + this.ball.width >= this.canvas.width;
        if (didBallLeaveThroughRightBoundary) {
            const winner = this.user;
            const loser = this.ai;
            this.handleWinnerLoser(winner, loser);

            if (winner.score !== SETTINGS.SCORE_TO_WIN) {
                AUDIO.SCORE.play();
            }
        }
    },

    handleBallTopBottomCollision: function () {
        const didBallCollideWithTopBoundary = this.ball.y <= 0;
        if (didBallCollideWithTopBoundary) {
            this.ball.moveY = DIRECTION.DOWN;
        }

        const didBallCollideWithBottomBoundary = this.ball.y + this.ball.height >= this.canvas.height;
        if (didBallCollideWithBottomBoundary) {
            this.ball.moveY = DIRECTION.UP;
        }
    },

    handleUserPaddleMovement: function () {
        const isUserPaddleMovingUp = this.user.move === DIRECTION.UP;
        if (isUserPaddleMovingUp) {
            this.user.y -= this.user.speed;
        }

        const isUserPaddleMovingDown = this.user.move === DIRECTION.DOWN;
        if (isUserPaddleMovingDown) {
            this.user.y += this.user.speed;
        }
    },

    handleWinnerLoser: function (winner, loser) {
        this.ball = Ball.new.call(this, this.ball.speed);
        this.previousLoser = loser;
        winner.score++;
        this.timer = (new Date()).getTime(); // gets the current time in miliseconds
    },

    didWeStartANewMatch: function () {
        const isTimerSet = this.timer >= 0;
        if (!isTimerSet) {
            return false;
        }

        const timePassed = (new Date()).getTime() - this.timer;
        const isTimePassedGreaterThanOneSeconds = timePassed >= 1000;

        return isTimePassedGreaterThanOneSeconds;
    },

    sendTheBallToThePreviousMatchLoser: function () {
        // Causes the ball to move either left or right depending on who lost the last round.
        // If this is just the beginning of the game, the ball will be sent to the AI.
        const directionToSendTheBall = (this.previousLoser === this.user) ? DIRECTION.LEFT : DIRECTION.RIGHT;
        this.ball.moveX = directionToSendTheBall;
        
        // Causes the ball to move either up or down randomly.
        const randomDirection = [DIRECTION.UP, DIRECTION.DOWN][Math.round(Math.random())];
        this.ball.moveY = randomDirection;

        // Causes the ball to start at a random vertical position.
        // The subtraction and addition of 200 is to make sure the ball
        // doesn't start too close to the top or bottom of the canvas.
        const randomStartingPoint = Math.floor((Math.random() * this.canvas.height) - 200) + 200;
        this.ball.y = randomStartingPoint;

        // Unset the timer
        this.timer = -1;
    },

    handleUserPaddleTopBottomCollision: function () {
        const didUserPaddleCollideWithTopBoundary = this.user.y <= 0;
        if (didUserPaddleCollideWithTopBoundary) {
            this.user.y = 0;    
        }

        const didUserPaddleCollideWithBottomBoundary = this.user.y + this.user.height >= this.canvas.height;
        if (didUserPaddleCollideWithBottomBoundary) {
            this.user.y = this.canvas.height - this.user.height;
        }
    },

    handleBallMovement: function () {
        if (this.ball.moveY !== DIRECTION.IDLE) {
            const moveDirection = (this.ball.moveY === DIRECTION.UP) ? -1 : 1;
            this.ball.y += (this.ball.speed / 1.5) * moveDirection;
        }

        if (this.ball.moveX !== DIRECTION.IDLE) {
            const moveDirection = (this.ball.moveX === DIRECTION.LEFT) ? -1 : 1;
            this.ball.x += this.ball.speed * moveDirection;
        }
    },

    handleAIPaddleMovement: function () {
        const isAIAboveBall = this.ai.y > this.ball.y - (this.ai.height / 2)
        if (isAIAboveBall) {
            if (this.ball.moveX === DIRECTION.RIGHT) {
                this.ai.y -= this.ai.speed / 1.5;
            } else {
                this.ai.y -= this.ai.speed / 4;
            }
        }

        const isAIBelowBall = this.ai.y < this.ball.y - (this.ai.height / 2);
        if (isAIBelowBall) {
            if (this.ball.moveX === DIRECTION.RIGHT) {
                this.ai.y += this.ai.speed / 1.5;
            } else {
                this.ai.y += this.ai.speed / 4;
            }
        }
    },

    handleAIPaddleTopBottomCollision: function () {
        const didAIPaddleCollideWithTopBoundary = this.ai.y <= 0;
        if (didAIPaddleCollideWithTopBoundary) {
            this.ai.y = 0;
        }

        const didAIPaddleCollideWithBottomBoundary = this.ai.y + this.ai.height >= this.canvas.height;
        if (didAIPaddleCollideWithBottomBoundary) {
            this.ai.y = this.canvas.height - this.ai.height;
        }
    },

    handlePaddleBallCollision: function () {
        const ballLeftOfUserRightEdge = this.ball.x - this.ball.width <= this.user.x;
        const ballRightOfUserLeftEdge = this.ball.x >= this.user.x - this.user.width;
        const ballAboveUserBottomEdge = this.ball.y <= this.user.y + this.user.height;
        const ballBelowUserTopEdge = this.ball.y + this.ball.height >= this.user.y;
        
        if (ballLeftOfUserRightEdge && ballRightOfUserLeftEdge && ballAboveUserBottomEdge && ballBelowUserTopEdge) {
            this.ball.x = (this.user.x + this.ball.width);
            this.ball.moveX = DIRECTION.RIGHT;
            AUDIO.PADDLE_BALL_COLLSION.play();
        }
        
        const ballLeftOfAIRightEdge = this.ball.x - this.ball.width <= this.ai.x;
        const ballRightOfAILeftEdge = this.ball.x >= this.ai.x - this.ai.width;
        const ballAboveAIBottomEdge = this.ball.y <= this.ai.y + this.ai.height;
        const ballBelowAITopEdge = this.ball.y + this.ball.height >= this.ai.y;
        
        if (ballLeftOfAIRightEdge && ballRightOfAILeftEdge && ballAboveAIBottomEdge && ballBelowAITopEdge) {
            this.ball.x = (this.ai.x - this.ball.width);
            this.ball.moveX = DIRECTION.LEFT;
            AUDIO.PADDLE_BALL_COLLSION.play();
        }
    },

    drawAllTheGameObjects: function () {
        this.clearCanvas();
        this.drawEmptyCanvas();
        this.drawPaddles();
        this.drawBall();
        this.drawBorderline();
        this.drawPlayersScore();
        this.drawWinScore();
    },

    clearCanvas: function () {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    },

    drawEmptyCanvas: function () {
        this.context.fillStyle = this.color;
        this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
    },

    drawPaddles: function () {
        this.context.fillStyle = SETTINGS.PADDLE_COLOR;
        this.context.fillRect(this.user.x, this.user.y, this.user.width, this.user.height);
        this.context.fillRect(this.ai.x, this.ai.y, this.ai.width, this.ai.height);
    },

    drawBall: function () {
        this.context.fillStyle = SETTINGS.BALL_COLOR;
        this.context.fillRect(this.ball.x, this.ball.y, this.ball.width, this.ball.height);
    },

    drawBorderline: function () {
        this.context.beginPath();
        this.context.setLineDash(SETTINGS.LINE_DASH);
        this.context.moveTo(this.canvas.width / 2, this.canvas.height - SETTINGS.LINE_Y_OFFSET);
        this.context.lineTo(this.canvas.width / 2, SETTINGS.LINE_Y_OFFSET);
        this.context.lineWidth = SETTINGS.LINE_WIDTH;
        this.context.strokeStyle = SETTINGS.LINE_COLOR;
        this.context.stroke();
    },

    drawPlayersScore: function () {
        this.context.font = SETTINGS.SCORE_TEXT_FONT;
        this.context.fillStyle = SETTINGS.SCORE_TEXT_COLOR;
        this.context.textAlign = SETTINGS.SCORE_TEXT_ALIGNMENT;
        this.context.fillText(
            this.user.score.toString(), 
            (this.canvas.width / 2) - SETTINGS.SCORE_TEXT_X_OFFSET, 
            SETTINGS.SCORE_TEXT_HEIGHT
        );
        this.context.fillText(
            this.ai.score.toString(), 
            (this.canvas.width / 2) + SETTINGS.SCORE_TEXT_X_OFFSET, 
            SETTINGS.SCORE_TEXT_HEIGHT
        );
    },

    drawWinScore: function () {
        this.context.font = SETTINGS.ROUND_SCORE_TEXT_FONT;
        this.context.fillStyle = SETTINGS.ROUND_SCORE_TEXT_COLOR;
        this.context.fillText(
            `Score to Win: ${SETTINGS.SCORE_TO_WIN}`, 
            this.canvas.width / 2,
            SETTINGS.ROUND_SCORE_TEXT_HEIGHT
        );
    },

    drawGameStartInstruction: function () {
        this.context.fillStyle = SETTINGS.CANVAS_BACKGROUND_COLOR;
        this.context.fillRect(
            this.canvas.width / 2 - 350,
			this.canvas.height / 2 - 48,
			700,
			100
        );

        this.context.font = SETTINGS.SCORE_TEXT_FONT;
        this.context.fillStyle = SETTINGS.SCORE_TEXT_COLOR;
        this.context.fillText(
            "Press Any Key To Start",
            this.canvas.width / 2,
            this.canvas.height / 2
        );
    }
};

// ------------------------------------------------------------------------------- //

// ------------------------------------ MAIN ------------------------------------- //

Game.start();

// ------------------------------------------------------------------------------- //

