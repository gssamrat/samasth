import { useState, useEffect } from 'react';
import { entityAPI } from '../services/api';
import toast from 'react-hot-toast';

export const useEntities = () => {
  const [stocks, setEntities] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch all entities
  const fetchStocks = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await entityAPI.getAllEntities();
      // Transform MySQL entity data to frontend format
      const transformedData = Array.isArray(data) ? data.map(entity => ({
       EName: entity.EName,
        EType: entity.EType,
        EID: entity.EID , // Handle undefined id
        CreatedAt: entity.CreatedAt,
        UpdatedAt: entity.UpdatedAt
      })) : [];
      for (const entity of transformedData) {
        console.log(entity.EName); 
      }
      setEntities(transformedData);
    } catch (err) {
      setError(err.message);
      toast.error(`Failed to fetch entities: ${err.message}`);
      setEntities([]);
    } finally {
      setLoading(false);
    }
  };

  // Add new entity
  const addEntity = async (entityData) => {
    try {
      const response = await entityAPI.createEntity(entityData);
      // Transform the response to match frontend format
      const newEntity = response.entity;
      const transformedEntity = {
        id: newEntity.EID,
        name: newEntity.EName,
        type: newEntity.EType,
        code: newEntity.ECode,
        
      };
      setEntities(prev => [transformedEntity, ...prev]);
      toast.success(`Item ${entityData.name} added successfully!`);
      return transformedEntity;
    } catch (err) {
      toast.error(`Failed to add stock: ${err.message}`);
      throw err;
    }
  };

  // Calculate portfolio statistics
  const getPortfolioStats = () => {
    if (!stocks.length) {
      return {
        totalItems: 0,
        itemTypes: 0,
        latestItem: 'None',
        totalCodes: 0
      };
    }

    const totalItems = stocks.length;
    const itemTypes = [...new Set(stocks.map(stock => stock.Type))].length;
    const latestItem = stocks.length > 0 ? stocks[0] : null;

    return {
      totalItems,
      itemTypes,
      latestItem: latestItem ? latestItem.Name : 'None',
      totalCodes: stocks.length
    };
  };

  // No longer automatically load stocks on mount
  // useEffect(() => {
  //   fetchStocks();
  // }, []);

  // Update stock
  const addEntityDetails = async (id, entityDetailData) => {
    try {
      const response = await entityAPI.createEntityDetail(entityDetailData);
      // Transform the response to match frontend format
      //const newEntityDetail = response.entityDetail;
      /*const transformedEntity = {
        id: newEntity.id,
        name: newEntity.e_name,
        type: newEntity.e_type,
        code: newEntity.e_code,
        created_at: newEntity.created_at,
        updated_at: newEntity.updated_at,
        // Initialize additional fields
        mrp: '',
        rate: '',
        gst: '',
        quantity: '',
        description: ''
      };
      setEntities(prev => [transformedEntity, ...prev]);*/
      toast.success(`Item ${entityDetailData.name} added successfully!`);
      return transformedEntity;
    } catch (err) {
      toast.error(`Failed to add stock: ${err.message}`);
      throw err;
    }
  };

  return {
    stocks,
    loading,
    error,
    fetchStocks,
    addEntity,
    addEntityDetails
  };
};
