/**
 * State transitions management for HATEOAS Resources
 * 
 * Handles the creation and management of state transitions for resources.
 * This class follows the Single Responsibility Principle by focusing only on state management.
 */

import { InvalidArgumentError, StateTransitionError } from './errors.ts';

export interface StateTransition {
  from: string;
  to: string;
  name: string;
  href: string;
  method: string;
  conditions?: Record<string, unknown>;
}

/**
 * Class responsible for managing state transitions
 */
export class ResourceState {
  private currentState = '';
  private transitions: StateTransition[] = [];
  
  /**
   * Create a new state manager
   * @param initialState - Optional initial state
   */
  constructor(initialState: string = '') {
    this.currentState = initialState;
  }
  
  /**
   * Set the current state
   * @param state - New state
   * @returns The new state
   */
  setState(state: string): string {
    if (typeof state !== 'string') {
      throw new InvalidArgumentError('State must be a string');
    }
    
    this.currentState = state;
    return this.currentState;
  }
  
  /**
   * Get the current state
   * @returns The current state
   */
  getState(): string {
    return this.currentState;
  }
  
  /**
   * Add a state transition
   * @param from - Starting state
   * @param to - Target state
   * @param name - Transition name
   * @param href - URI for the transition
   * @param method - HTTP method
   * @param conditions - Conditions for the transition
   * @returns The created transition
   */
  addTransition(from: string, to: string, name: string, href: string, method: string = 'POST', conditions?: Record<string, unknown>): StateTransition {
    if (typeof from !== 'string' || !from) {
      throw new InvalidArgumentError('"from" state must be a non-empty string');
    }
    
    if (typeof to !== 'string' || !to) {
      throw new InvalidArgumentError('"to" state must be a non-empty string');
    }
    
    if (typeof name !== 'string' || !name) {
      throw new InvalidArgumentError('Transition name must be a non-empty string');
    }
    
    if (typeof href !== 'string' || !href) {
      throw new InvalidArgumentError('Transition href must be a non-empty string');
    }
    
    const transition: StateTransition = {
      from,
      to,
      name,
      href,
      method,
      conditions
    };
    
    this.transitions.push(transition);
    return transition;
  }
  
  /**
   * Get all transitions
   * @returns All transitions
   */
  getTransitions(): StateTransition[] {
    return [...this.transitions];
  }
  
  /**
   * Get available transitions from a given state
   * @param state - Current state
   * @param properties - Resource properties to check against conditions
   * @returns Available transitions
   */
  getAvailableTransitions(state: string, properties: Record<string, unknown> = {}): StateTransition[] {
    return this.transitions.filter(transition => {
      // Must match current state
      if (transition.from !== state) {
        return false;
      }
      
      // Check conditions if any
      if (transition.conditions) {
        return Object.entries(transition.conditions).every(([key, condition]) => {
          if (typeof condition === 'object' && condition !== null) {
            if ('exists' in condition) {
              return condition.exists ? key in properties : !(key in properties);
            }
            return false;
          }
          return properties[key] === condition;
        });
      }
      
      return true;
    });
  }
  
  /**
   * Apply a transition by name
   * @param name - Transition name
   * @param state - Current state
   * @param properties - Resource properties
   * @returns New state
   * @throws {StateTransitionError} If transition is not available
   */
  applyTransition(name: string, state: string, properties: Record<string, unknown> = {}): string {
    const availableTransitions = this.getAvailableTransitions(state, properties);
    const transition = availableTransitions.find(t => t.name === name);
    
    if (!transition) {
      throw new StateTransitionError(`No transition found with name '${name}'`);
    }
    
    return transition.to;
  }
  
  /**
   * Clone the state manager
   * @returns A new state manager with the same data
   */
  clone(): ResourceState {
    const clone = new ResourceState(this.currentState);
    
    // Copy transitions
    this.transitions.forEach(transition => {
      clone.addTransition(
        transition.from,
        transition.to,
        transition.name,
        transition.href,
        transition.method,
        transition.conditions ? { ...transition.conditions } : undefined
      );
    });
    
    return clone;
  }
} 