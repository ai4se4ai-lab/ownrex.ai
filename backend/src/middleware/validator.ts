/**
 * Request Validation Middleware
 */

import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ValidationError } from '../utils/errors';
import { REQUEST_LIMITS } from '../config/constants';

/**
 * Chat completion request schema
 */
export const chatCompletionSchema = Joi.object({
  model: Joi.string().optional(),
  messages: Joi.array().items(
    Joi.object({
      role: Joi.string().valid('system', 'user', 'assistant', 'function', 'tool').required(),
      content: Joi.alternatives().try(Joi.string(), Joi.allow(null)).optional(),
      name: Joi.string().optional(),
      function_call: Joi.object({
        name: Joi.string().required(),
        arguments: Joi.string().required()
      }).optional(),
      tool_calls: Joi.array().items(
        Joi.object({
          id: Joi.string().required(),
          type: Joi.string().valid('function').required(),
          function: Joi.object({
            name: Joi.string().required(),
            arguments: Joi.string().required()
          }).required()
        })
      ).optional(),
      tool_call_id: Joi.string().optional()
    })
  ).min(1).max(REQUEST_LIMITS.MAX_MESSAGES).required(),
  temperature: Joi.number().min(0).max(2).optional(),
  top_p: Joi.number().min(0).max(1).optional(),
  n: Joi.number().integer().min(1).max(10).optional(),
  stream: Joi.boolean().optional(),
  stop: Joi.alternatives().try(
    Joi.string(),
    Joi.array().items(Joi.string()).max(4)
  ).optional(),
  max_tokens: Joi.number().integer().min(1).optional(),
  presence_penalty: Joi.number().min(-2).max(2).optional(),
  frequency_penalty: Joi.number().min(-2).max(2).optional(),
  logit_bias: Joi.object().pattern(Joi.string(), Joi.number()).optional(),
  user: Joi.string().optional(),
  tools: Joi.array().items(
    Joi.object({
      type: Joi.string().valid('function').required(),
      function: Joi.object({
        name: Joi.string().required(),
        description: Joi.string().optional(),
        parameters: Joi.object().optional()
      }).required()
    })
  ).optional(),
  tool_choice: Joi.alternatives().try(
    Joi.string().valid('none', 'auto', 'required'),
    Joi.object({
      type: Joi.string().valid('function').required(),
      function: Joi.object({
        name: Joi.string().required()
      }).required()
    })
  ).optional(),
  response_format: Joi.object({
    type: Joi.string().valid('text', 'json_object').required()
  }).optional(),
  seed: Joi.number().integer().optional()
});

/**
 * Completion request schema
 */
export const completionSchema = Joi.object({
  model: Joi.string().optional(),
  prompt: Joi.alternatives().try(
    Joi.string().max(REQUEST_LIMITS.MAX_PROMPT_LENGTH),
    Joi.array().items(Joi.string().max(REQUEST_LIMITS.MAX_PROMPT_LENGTH))
  ).required(),
  suffix: Joi.string().optional(),
  max_tokens: Joi.number().integer().min(1).optional(),
  temperature: Joi.number().min(0).max(2).optional(),
  top_p: Joi.number().min(0).max(1).optional(),
  n: Joi.number().integer().min(1).max(10).optional(),
  stream: Joi.boolean().optional(),
  logprobs: Joi.number().integer().min(0).max(5).optional(),
  echo: Joi.boolean().optional(),
  stop: Joi.alternatives().try(
    Joi.string(),
    Joi.array().items(Joi.string()).max(4)
  ).optional(),
  presence_penalty: Joi.number().min(-2).max(2).optional(),
  frequency_penalty: Joi.number().min(-2).max(2).optional(),
  best_of: Joi.number().integer().min(1).max(10).optional(),
  logit_bias: Joi.object().pattern(Joi.string(), Joi.number()).optional(),
  user: Joi.string().optional()
});

/**
 * Embedding request schema
 */
export const embeddingSchema = Joi.object({
  model: Joi.string().optional(),
  input: Joi.alternatives().try(
    Joi.string(),
    Joi.array().items(Joi.string()).max(REQUEST_LIMITS.MAX_EMBEDDING_INPUTS)
  ).required(),
  encoding_format: Joi.string().valid('float', 'base64').optional(),
  dimensions: Joi.number().integer().min(1).optional(),
  user: Joi.string().optional()
});

/**
 * Create validation middleware for a schema
 */
export function validateBody(schema: Joi.ObjectSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const message = error.details
        .map(detail => detail.message)
        .join('; ');
      
      const firstError = error.details[0];
      const param = firstError?.path.join('.');

      next(new ValidationError(message, param));
      return;
    }

    // Replace body with validated value
    req.body = value;
    next();
  };
}

/**
 * Validate chat completion request
 */
export const validateChatCompletion = validateBody(chatCompletionSchema);

/**
 * Validate completion request
 */
export const validateCompletion = validateBody(completionSchema);

/**
 * Validate embedding request
 */
export const validateEmbedding = validateBody(embeddingSchema);

export default validateBody;

