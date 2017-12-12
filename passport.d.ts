declare module 'floof-passport' {
  /**
   * A JSON-safe value.
   */
  type Serialized = string | number;
  
  /**
   * A serialization scheme for representing users as JSON-serializable identifiers.
   */
  interface UserSerialization {
    /**
     * Serializes a user object to some identifier.
     * May be async.
     */
    serialize(user: any): Serialized;
    
    /**
     * Retrieves a user object for a previously-serialized identifier.
     * May be async.
     */
    deserialize(ser: Serialized): any;
  }
  
  /**
   * The floof-passport plugin. Register an instance with FloofBall#plugin.
   */
  export class PassportPlugin {
    /**
     * Initializes the plugin.
     * @param session Whether to use persistent login sessions or not. Defaults to false.
     * @param userSerialization A user serialization scheme. Required if login sessions are enabled.
     */
    constructor(session?: boolean, userSerialization?: UserSerialization);
    
    /**
     * Registers a passport strategy.
     * @param strategy The strategy to be registered.
     * @returns This PassportPlugin instance, for the sake of chaining.
     */
    use(strategy: any): PassportPlugin;
  }
}