import Joi from '@hapi/joi';
import express from 'express';
import CharacterProxy from '../../../proxy/character-proxy';

class Character {
  constructor(proxy = new CharacterProxy()) {
    this.proxy = proxy;
  }

  getCharacterIdsSchema = () =>
    Joi.object({
      query: Joi.object({
        cursor: Joi.string().default(null),
        limit: Joi.number()
          .integer()
          .positive()
          .default(10),
      }),
    }).unknown(true);

  getCharacterIds = async (req, res) => {
    // TODO: return 400 error if validation fails
    const {
      query: { limit, cursor },
    } = await Joi.validate(req, this.getCharacterIdsSchema());
    const ids = await this.proxy.getCharacterIds(limit, cursor);
    res.type('application/json').send({
      ...ids,
      items: ids.items.map(character => ({
        ...character,
        href: `${req.baseUrl}/${character.id}`,
      })),
    });
  };

  getCharacterById = async (req, res) => {
    const { characterId } = req.params;
    const character = await this.proxy.getCharacterById(characterId);

    if (!character) {
      res
        .status(404)
        .type('application/json')
        .end();
      return;
    }

    res.type('application/json').send(character);
  };

  initialize() {
    this.router = express.Router();
    this.router.get('/:characterId', this.getCharacterById);
    this.router.get('/', this.getCharacterIds);
    return this;
  }
}

export default Character;
