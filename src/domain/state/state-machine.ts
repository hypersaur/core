/**
 * State Machine domain model
 * Represents state transitions and state management for resources
 */

import { InvalidArgumentError } from '../../infrastructure/errors/api-error.ts';
import { StateTransitionError } from '../../infrastructure/errors/domain-errors.ts';

/**
 * State transition interface
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
 * Resource State class
 */
export class ResourceState {
  private currentState = '';
  private transitions: StateTransition[] = [];
  
  constructor(initialState: string = '') {
    this.currentState = initialState;
  }
  
  setState(state: string): string {
    if (typeof state !== 'string') {
      throw new InvalidArgumentError('State must be a string');
    }
    
    this.currentState = state;
    return this.currentState;
  }
  
  getState(): string {
    return this.currentState;
  }
  
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
  
  getTransitions(): StateTransition[] {
    return [...this.transitions];
  }
  
  getAvailableTransitions(state: string, properties: Record<string, unknown> = {}): StateTransition[] {
    return this.transitions.filter(transition => {
      if (transition.from !== state) {
        return false;
      }
      
      if (transition.conditions) {
        return Object.entries(transition.conditions).every(([key, condition]) => {
          if (typeof condition === 'object' && condition !== null && 'exists' in condition) {
            const exists = (condition as { exists: boolean }).exists;
            return exists ? key in properties : !(key in properties);
          }
          return properties[key] === condition;
        });
      }
      
      return true;
    });
  }
  
  applyTransition(name: string, state: string, properties: Record<string, unknown> = {}): string {
    const availableTransitions = this.getAvailableTransitions(state, properties);
    const transition = availableTransitions.find(t => t.name === name);
    
    if (!transition) {
      throw new StateTransitionError(`No transition found with name '${name}'`);
    }
    
    return transition.to;
  }
  
  clone(): ResourceState {
    const clone = new ResourceState(this.currentState);
    
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