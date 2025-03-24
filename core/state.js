/**
 * State transitions management for HATEOAS Resources
 * 
 * Handles the creation and management of state transitions for resources.
 * This class follows the Single Responsibility Principle by focusing only on state management.
 */

import { InvalidArgumentError, StateTransitionError } from './errors.js';

/**
 * @typedef {Object} StateTransition
 * @property {string} from - Starting state
 * @property {string} to - Target state
 * @property {string} name - Transition name
 * @property {string} href - URI for the transition
 * @property {string} method - HTTP method for the transition
 * @property {Object} [conditions] - Conditions that must be met for the transition
 */

/**
 * Class responsible for managing state transitions
 */
class ResourceState {
  #currentState = '';
  #transitions = [];
  
  /**
   * Create a new state manager
   * @param {string} [initialState] - Optional initial state
   */
  constructor(initialState = '') {
    this.#currentState = initialState;
  }
  
  /**
   * Set the current state
   * @param {string} state - New state
   * @returns {string} The new state
   */
  setState(state) {
    if (typeof state !== 'string') {
      throw new InvalidArgumentError('State must be a string');
    }
    
    this.#currentState = state;
    return this.#currentState;
  }
  
  /**
   * Get the current state
   * @returns {string} The current state
   */
  getState() {
    return this.#currentState;
  }
  
  /**
   * Add a state transition
   * @param {string} from - Starting state
   * @param {string} to - Target state
   * @param {string} name - Transition name
   * @param {string} href - URI for the transition
   * @param {string} [method='POST'] - HTTP method
   * @param {Object} [conditions] - Conditions for the transition
   * @returns {StateTransition} The created transition
   */
  addTransition(from, to, name, href, method = 'POST', conditions = null) {
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
    
    const transition = {
      from,
      to,
      name,
      href,
      method,
      conditions
    };
    
    this.#transitions.push(transition);
    return transition;
  }
  
  /**
   * Get all transitions
   * @returns {StateTransition[]} All transitions
   */
  getTransitions() {
    return [...this.#transitions];
  }
  
  /**
   * Get available transitions from a given state
   * @param {string} state - Current state
   * @param {Object} [properties={}] - Resource properties to check against conditions
   * @returns {StateTransition[]} Available transitions
   */
  getAvailableTransitions(state, properties = {}) {
    return this.#transitions.filter(transition => {
      // Must match current state
      if (transition.from !== state) {
        return false;
      }
      
      // Check conditions if any
      if (transition.conditions) {
        return Object.entries(transition.conditions).every(
          ([key, value]) => properties[key] === value
        );
      }
      
      return true;
    });
  }
  
  /**
   * Apply a transition
   * @param {string} currentState - Current state
   * @param {string} transitionName - Transition name to apply
   * @param {Object} [properties={}] - Resource properties to check against conditions
   * @returns {string} The new state
   * @throws {StateTransitionError} If the transition is not available
   */
  applyTransition(currentState, transitionName, properties = {}) {
    // Find the transition
    const transition = this.#transitions.find(
      t => t.name === transitionName && t.from === currentState
    );
    
    if (!transition) {
      throw new StateTransitionError(
        `Transition '${transitionName}' not available from state '${currentState}'`
      );
    }
    
    // Check conditions
    if (transition.conditions) {
      const conditionsMet = Object.entries(transition.conditions).every(
        ([key, value]) => properties[key] === value
      );
      
      if (!conditionsMet) {
        throw new StateTransitionError(
          `Conditions not met for transition '${transitionName}'`
        );
      }
    }
    
    // Return the new state
    return transition.to;
  }
  
  /**
   * Clone the state manager
   * @returns {ResourceState} A new state manager with the same data
   */
  clone() {
    const clone = new ResourceState(this.#currentState);
    
    // Copy transitions
    this.#transitions.forEach(transition => {
      clone.addTransition(
        transition.from,
        transition.to,
        transition.name,
        transition.href,
        transition.method,
        transition.conditions ? { ...transition.conditions } : null
      );
    });
    
    return clone;
  }
}

export { ResourceState };