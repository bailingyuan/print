// GPIO control for stepper motor (42 stepper motor)
// Requires pigpio or rpio library for GPIO control on Raspberry Pi

let currentPosition = 0

let STEPPER_CONFIG = {
  dirPin: 20,
  stepPin: 21,
  enablePin: 16,
  stepsPerRevolution: 200,
}

/**
 * Update stepper motor configuration
 */
export function updateStepperConfig(config: { dirPin: number; stepPin: number; enablePin: number }) {
  STEPPER_CONFIG = {
    ...STEPPER_CONFIG,
    ...config,
  }
}

/**
 * Get current stepper configuration
 */
export function getStepperConfig() {
  return STEPPER_CONFIG
}

let Gpio: any = null

// Try to load GPIO library (only works on Raspberry Pi)
try {
  const pigpio = require("pigpio")
  Gpio = pigpio.Gpio
} catch (error) {
  console.warn("[v0] GPIO library not available (not on Raspberry Pi?)")
}

/**
 * Initialize GPIO pins for stepper motor
 */
function initGPIO() {
  if (!Gpio) {
    console.warn("[v0] GPIO not initialized")
    return null
  }

  try {
    const dirGpio = new Gpio(STEPPER_CONFIG.dirPin, { mode: Gpio.OUTPUT })
    const stepGpio = new Gpio(STEPPER_CONFIG.stepPin, { mode: Gpio.OUTPUT })
    const enableGpio = new Gpio(STEPPER_CONFIG.enablePin, { mode: Gpio.OUTPUT })

    // Enable the motor
    enableGpio.digitalWrite(0) // Active LOW

    return { dirGpio, stepGpio, enableGpio }
  } catch (error) {
    console.error("[v0] Failed to initialize GPIO:", error)
    return null
  }
}

/**
 * Move rail in specified direction
 */
export async function moveRail(
  direction: "left" | "right",
  steps: number,
): Promise<{ success: boolean; position: number }> {
  const gpios = initGPIO()

  if (!gpios) {
    // Simulate movement for testing
    console.log(`[v0] Simulating rail movement: ${direction}, ${steps} steps`)
    currentPosition += direction === "right" ? steps : -steps
    return { success: true, position: currentPosition }
  }

  try {
    const { dirGpio, stepGpio } = gpios

    // Set direction
    dirGpio.digitalWrite(direction === "right" ? 1 : 0)

    // Generate step pulses
    for (let i = 0; i < steps; i++) {
      stepGpio.digitalWrite(1)
      await delay(1) // 1ms high
      stepGpio.digitalWrite(0)
      await delay(1) // 1ms low (adjust for desired speed)
    }

    // Update position
    currentPosition += direction === "right" ? steps : -steps

    return { success: true, position: currentPosition }
  } catch (error) {
    console.error("[v0] Stepper move error:", error)
    return { success: false, position: currentPosition }
  }
}

/**
 * Reset rail to home position
 */
export async function homeRail(): Promise<{ success: boolean; position: number }> {
  // Move to home position (position 0)
  const stepsToHome = Math.abs(currentPosition)
  const direction = currentPosition > 0 ? "left" : "right"

  return moveRail(direction, stepsToHome)
}

/**
 * Get current rail position
 */
export function getRailPosition(): number {
  return currentPosition
}

/**
 * Utility delay function
 */
function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
