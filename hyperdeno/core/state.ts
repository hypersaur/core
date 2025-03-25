/**
 * 🔄 State Transitions Management for HATEOAS Resources
 * 
 * This module implements state transition management for HATEOAS resources, enabling
 * clients to understand and navigate through the possible states of a resource.
 * State transitions are a crucial aspect of HATEOAS, representing the available
 * actions that can change a resource's state.
 * 
 * Key HATEOAS features:
 * - State machine implementation for resources
 * - Conditional transitions based on resource properties
 * - Hypermedia-driven state changes
 * - Self-descriptive state transitions
 * 
 * @example
 * ```typescript
 * const stateManager = new ResourceState('draft');
 * stateManager.addTransition('draft', 'published', 'publish', '/posts/123/publish', 'POST');
 * ```
 */

import { InvalidArgumentError, StateTransitionError } from './errors.ts';

/**
 * 🔄 Interface defining a state transition in HATEOAS
 * 
 * State transitions represent the possible ways a resource can change state,
 * including the conditions that must be met and the hypermedia controls
 * needed to trigger the transition.
 * 
 * @interface StateTransition
 * @property {string} from - The source state
 * @property {string} to - The target state
 * @property {string} name - The transition name
 * @property {string} href - The URI for the transition
 * @property {string} method - The HTTP method for the transition
 * @property {Record<string, unknown>} [conditions] - Conditions that must be met
 */
export interface StateTransition {
  from: string;
  to: string;
  name: string;
  href: string;
  method: string;
  conditions?: Record<string, unknown>;
}

/**
 * 🎯 Class responsible for managing state transitions
 * 
 * This class implements the state machine functionality required by HATEOAS,
 * providing methods for defining and managing state transitions. It ensures
 * that state changes are controlled and predictable, with clear conditions
 * and hypermedia controls.
 * 
 * @class ResourceState
 */
export class ResourceState {
  private currentState = '';
  private transitions: StateTransition[] = [];
  
  /**
   * 🎨 Creates a new state manager
   * 
   * Initializes a new state manager with an optional initial state. This
   * allows for creating pre-configured state machines with known states.
   * 
   * @param {string} [initialState=''] - The initial state of the resource
   */
  constructor(initialState: string = '') {
    this.currentState = initialState;
  }
  
  /**
   * 🔄 Sets the current state of the resource
   * 
   * Updates the resource's current state, which is essential for tracking
   * the resource's condition and determining available transitions.
   * 
   * @param {string} state - The new state
   * @throws {InvalidArgumentError} If state is not a string
   * @returns {string} The new state
   */
  setState(state: string): string {
    if (typeof state !== 'string') {
      throw new InvalidArgumentError('State must be a string');
    }
    
    this.currentState = state;
    return this.currentState;
  }
  
  /**
   * 📊 Gets the current state of the resource
   * 
   * Returns the resource's current state, which is crucial for clients
   * to understand what transitions are available.
   * 
   * @returns {string} The current state
   */
  getState(): string {
    return this.currentState;
  }
  
  /**
   * ➕ Adds a state transition
   * 
   * Defines a new possible state transition, including its conditions and
   * the hypermedia controls needed to trigger it. This is essential for
   * implementing the HATEOAS principle of hypermedia-driven state changes.
   * 
   * @param {string} from - The source state
   * @param {string} to - The target state
   * @param {string} name - The transition name
   * @param {string} href - The URI for the transition
   * @param {string} [method='POST'] - The HTTP method for the transition
   * @param {Record<string, unknown>} [conditions] - Conditions for the transition
   * @throws {InvalidArgumentError} If any required parameters are invalid
   * @returns {StateTransition} The created transition
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
   * 📚 Gets all defined transitions
   * 
   * Returns all possible state transitions, which is useful for
   * understanding the complete state machine of the resource.
   * 
   * @returns {StateTransition[]} All transitions
   */
  getTransitions(): StateTransition[] {
    return [...this.transitions];
  }
  
  /**
   * 🔍 Gets available transitions from a given state
   * 
   * Determines which transitions are available based on the current state
   * and resource properties. This is crucial for clients to understand
   * what actions they can take.
   * 
   * @param {string} state - Current state
   * @param {Record<string, unknown>} [properties] - Resource properties to check against conditions
   * @returns {StateTransition[]} Available transitions
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
   * 🔄 Applies a state transition
   * 
   * Executes a state transition, updating the resource's state and ensuring
   * all conditions are met. This is the core mechanism for state changes
   * in the HATEOAS architecture.
   * 
   * @param {string} name - The transition name
   * @param {string} state - Current state
   * @param {Record<string, unknown>} [properties] - Resource properties
   * @throws {StateTransitionError} If transition is not available
   * @returns {string} The new state
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
   * 📋 Creates a deep copy of the state manager
   * 
   * Useful for creating independent copies of state machines, which is
   * important when dealing with resource templates or when modifications
   * need to be isolated from the original state machine.
   * 
   * @returns {ResourceState} A new state manager with the same data
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